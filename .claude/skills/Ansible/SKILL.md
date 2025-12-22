---
name: Ansible
description: Infrastructure automation and configuration management. USE WHEN user mentions Ansible, playbooks, node maintenance, rolling upgrades, server configuration, OR needs automated infrastructure tasks across multiple hosts.
---

# Ansible

Infrastructure automation skill for managing k3s nodes and server configuration. Provides repeatable, idempotent automation with Git-tracked playbooks.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Ansible
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Install** | "install ansible", "set up automation" | `workflows/Install.md` |
| **RollingUpgrade** | "upgrade nodes", "patch servers", "monthly maintenance" | `workflows/RollingUpgrade.md` |
| **CreatePlaybook** | "create playbook", "automate task" | `workflows/CreatePlaybook.md` |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Ansible Control Flow                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │  Control Node   │  (Your Mac or a dedicated server)              │
│  │  - Ansible CLI  │                                                │
│  │  - Playbooks    │                                                │
│  │  - Inventory    │                                                │
│  └────────┬────────┘                                                │
│           │ SSH                                                     │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Managed Nodes                             │   │
│  ├─────────────────┬─────────────────┬─────────────────────────┤   │
│  │      ai2        │      ai1        │        nas1             │   │
│  │   10.0.20.22    │   10.0.20.21    │     10.0.20.15          │   │
│  │   Ubuntu 24.04  │   Ubuntu 24.04  │     Unraid 7.2          │   │
│  │   apt-based     │   apt-based     │     slackpkg-based      │   │
│  └─────────────────┴─────────────────┴─────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Playbook** | YAML file defining tasks to run on hosts |
| **Inventory** | List of managed hosts with groupings |
| **Role** | Reusable collection of tasks, handlers, variables |
| **Task** | Single action (install package, copy file, run command) |
| **Handler** | Task triggered by notifications (e.g., restart service) |
| **Idempotent** | Running twice produces same result as running once |

## Inventory Structure

```ini
# inventory/hosts.ini
[k3s_servers]
ai2 ansible_host=10.0.20.22
ai1 ansible_host=10.0.20.21

[k3s_control_only]
nas1 ansible_host=10.0.20.15

[k3s:children]
k3s_servers
k3s_control_only

[ubuntu]
ai2
ai1

[unraid]
nas1

[all:vars]
ansible_user=root
ansible_python_interpreter=/usr/bin/python3
```

## Common Playbooks

### OS Update (Rolling)

```yaml
# playbooks/update-nodes.yaml
---
- name: Rolling OS Update for k3s Nodes
  hosts: k3s
  become: yes
  serial: 1  # One node at a time

  tasks:
    - name: Drain node from k3s cluster
      delegate_to: localhost
      become: no
      command: kubectl drain {{ inventory_hostname }} --ignore-daemonsets --delete-emptydir-data --timeout=120s
      when: "'k3s_control_only' not in group_names"

    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Upgrade all packages
      apt:
        upgrade: dist
        autoremove: yes
      when: ansible_os_family == "Debian"
      register: apt_result

    - name: Check if reboot required
      stat:
        path: /var/run/reboot-required
      register: reboot_required
      when: ansible_os_family == "Debian"

    - name: Reboot if required
      reboot:
        reboot_timeout: 300
        msg: "Ansible-triggered reboot for OS updates"
      when:
        - ansible_os_family == "Debian"
        - reboot_required.stat.exists

    - name: Wait for node to be ready
      delegate_to: localhost
      become: no
      command: kubectl wait --for=condition=Ready node/{{ inventory_hostname }} --timeout=120s
      when: "'k3s_control_only' not in group_names"

    - name: Uncordon node
      delegate_to: localhost
      become: no
      command: kubectl uncordon {{ inventory_hostname }}
      when: "'k3s_control_only' not in group_names"
```

### Security Patches Only

```yaml
# playbooks/security-updates.yaml
---
- name: Security Updates Only
  hosts: ubuntu
  become: yes
  serial: 1

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes

    - name: Install security updates only
      apt:
        upgrade: yes
        update_cache: yes
        default_release: "{{ ansible_distribution_release }}-security"
```

### k3s Upgrade

```yaml
# playbooks/upgrade-k3s.yaml
---
- name: Upgrade k3s Version
  hosts: k3s
  become: yes
  serial: 1
  vars:
    k3s_version: "v1.28.4+k3s1"  # Specify target version

  tasks:
    - name: Drain node
      delegate_to: localhost
      become: no
      command: kubectl drain {{ inventory_hostname }} --ignore-daemonsets --delete-emptydir-data
      when: "'k3s_control_only' not in group_names"

    - name: Stop k3s
      systemd:
        name: k3s
        state: stopped

    - name: Upgrade k3s
      shell: |
        curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION={{ k3s_version }} sh -
      args:
        warn: false

    - name: Start k3s
      systemd:
        name: k3s
        state: started

    - name: Wait for node ready
      delegate_to: localhost
      become: no
      command: kubectl wait --for=condition=Ready node/{{ inventory_hostname }} --timeout=300s

    - name: Uncordon node
      delegate_to: localhost
      become: no
      command: kubectl uncordon {{ inventory_hostname }}
      when: "'k3s_control_only' not in group_names"
```

## Notification System

### Monthly Maintenance Reminder

Create a cron job or use a scheduled GitLab CI pipeline to remind you:

**Option 1: Local cron (on Mac)**
```bash
# Add to crontab -e
0 9 1 * * osascript -e 'display notification "Time for monthly k3s node maintenance!" with title "Infrastructure Reminder"'
```

**Option 2: Joplin Recurring Task**
Create a recurring todo in Joplin for the 1st of each month.

**Option 3: GitLab Scheduled Pipeline (Recommended)**
```yaml
# .gitlab-ci.yml
stages:
  - notify
  - maintenance

monthly-reminder:
  stage: notify
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  script:
    - |
      curl -X POST "$DISCORD_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"content": "🔧 **Monthly Infrastructure Maintenance Reminder**\n\nTime to run: `ansible-playbook playbooks/update-nodes.yaml`\n\nCheck for:\n- OS security patches\n- k3s version updates\n- Container image updates"}'

# Optional: Auto-run maintenance (use with caution)
auto-maintenance:
  stage: maintenance
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: manual  # Require manual approval
  script:
    - ansible-playbook -i inventory/hosts.ini playbooks/update-nodes.yaml
```

**Option 4: Discord/Slack Bot**
```bash
#!/bin/bash
# monthly-reminder.sh - Run via cron on 1st of month
curl -X POST "$DISCORD_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "🔧 Monthly Infrastructure Maintenance",
      "description": "Time to update your k3s nodes!",
      "color": 5814783,
      "fields": [
        {"name": "Command", "value": "`ansible-playbook playbooks/update-nodes.yaml`"},
        {"name": "Nodes", "value": "ai2, ai1, nas1"}
      ]
    }]
  }'
```

## Directory Structure

```
~/src/bfinfrastructure/ansible/
├── ansible.cfg              # Ansible configuration
├── inventory/
│   └── hosts.ini           # Host inventory
├── playbooks/
│   ├── update-nodes.yaml   # Full OS update (rolling)
│   ├── security-updates.yaml
│   ├── upgrade-k3s.yaml
│   └── setup-node.yaml     # Initial node setup
├── roles/
│   ├── common/             # Common tasks for all nodes
│   ├── k3s-server/         # k3s server setup
│   └── k3s-agent/          # k3s agent setup (if needed)
└── group_vars/
    ├── all.yaml            # Variables for all hosts
    ├── ubuntu.yaml         # Ubuntu-specific vars
    └── unraid.yaml         # Unraid-specific vars
```

## ansible.cfg

```ini
[defaults]
inventory = inventory/hosts.ini
remote_user = root
host_key_checking = False
retry_files_enabled = False
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 3600

[privilege_escalation]
become = True
become_method = sudo
become_user = root

[ssh_connection]
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

## Quick Commands

```bash
# Test connectivity
ansible all -m ping

# Run playbook (dry-run)
ansible-playbook playbooks/update-nodes.yaml --check

# Run playbook (actual)
ansible-playbook playbooks/update-nodes.yaml

# Run on specific host
ansible-playbook playbooks/update-nodes.yaml --limit ai2

# Run with verbose output
ansible-playbook playbooks/update-nodes.yaml -vvv

# List hosts in inventory
ansible-inventory --list

# Get facts from a host
ansible ai2 -m setup
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **k3s** | Ansible handles node drain/uncordon during updates |
| **Longhorn** | Longhorn replicates data during node maintenance |
| **ArgoCD** | GitOps manages container updates, Ansible manages OS |
| **GitLab** | Store playbooks in Git, run via CI/CD |
| **Infra** | Ansible automates infrastructure maintenance |

## Maintenance Schedule

| Frequency | Task | Automation Level |
|-----------|------|------------------|
| Daily | Security patches (unattended-upgrades) | Automatic |
| Monthly | Full OS upgrade | Manual trigger + reminder |
| Quarterly | k3s version upgrade | Manual trigger |
| As needed | Container updates | Automatic (ArgoCD) |

## Safety Features

1. **Serial execution**: `serial: 1` ensures one node at a time
2. **Drain before update**: Workloads migrate to healthy nodes
3. **Uncordon after success**: Node rejoins cluster only after healthy
4. **Dry-run mode**: `--check` previews changes without applying
5. **Limit option**: `--limit` targets specific hosts for testing

## Unraid Considerations

nas1 runs Unraid which uses Slackware, not apt. Playbooks should:

```yaml
- name: Update Unraid packages
  when: "'unraid' in group_names"
  block:
    - name: Update package cache
      command: slackpkg update

    - name: Upgrade packages
      command: slackpkg upgrade-all
      register: upgrade_result
```

Note: Unraid updates are typically done via the web UI. Ansible can trigger but manual verification recommended.

---

**Ansible skill provides automated, repeatable infrastructure maintenance for k3s cluster nodes.**
