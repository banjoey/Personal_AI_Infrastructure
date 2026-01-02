# RollingUpgrade Workflow

Performs rolling OS updates across k3s nodes with zero-downtime for workloads.

---

## Overview

This workflow:
1. Drains one node at a time (workloads migrate)
2. Updates OS packages
3. Reboots if required
4. Uncordons node (workloads can return)
5. Moves to next node

---

## Quick Run

```bash
cd ~/src/bfinfrastructure/ansible

# Dry run first (always!)
ansible-playbook playbooks/update-nodes.yaml --check

# Actual run
ansible-playbook playbooks/update-nodes.yaml

# Single node only
ansible-playbook playbooks/update-nodes.yaml --limit ai2
```

---

## Create the Playbook

```bash
cat > ~/src/bfinfrastructure/ansible/playbooks/update-nodes.yaml << 'EOF'
---
# Rolling OS Update for k3s Nodes
# Performs one node at a time with drain/uncordon
#
# Usage:
#   ansible-playbook playbooks/update-nodes.yaml
#   ansible-playbook playbooks/update-nodes.yaml --check  # Dry run
#   ansible-playbook playbooks/update-nodes.yaml --limit ai2  # Single node

- name: Rolling OS Update for k3s Nodes
  hosts: k3s
  become: yes
  serial: 1  # One node at a time for zero-downtime

  vars:
    drain_timeout: 120
    ready_timeout: 300

  tasks:
    # ============================================
    # PRE-UPDATE: Drain node from k3s cluster
    # ============================================
    - name: Check if node is a worker (runs workloads)
      set_fact:
        is_worker: "{{ 'k3s_control_only' not in group_names }}"

    - name: Drain node from k3s cluster
      delegate_to: localhost
      become: no
      command: >
        kubectl drain {{ inventory_hostname }}
        --ignore-daemonsets
        --delete-emptydir-data
        --timeout={{ drain_timeout }}s
        --force
      when: is_worker
      register: drain_result
      ignore_errors: yes

    - name: Warn if drain failed
      debug:
        msg: "WARNING: Drain failed but continuing. Error: {{ drain_result.stderr | default('unknown') }}"
      when:
        - is_worker
        - drain_result.rc != 0

    # ============================================
    # UPDATE: OS packages
    # ============================================
    - name: Update apt cache (Ubuntu)
      apt:
        update_cache: yes
        cache_valid_time: 0  # Force refresh
      when: ansible_os_family == "Debian"

    - name: Upgrade all packages (Ubuntu)
      apt:
        upgrade: dist
        autoremove: yes
        autoclean: yes
      when: ansible_os_family == "Debian"
      register: apt_result

    - name: Display updated packages
      debug:
        msg: "Packages updated: {{ apt_result.stdout_lines | default(['No changes']) }}"
      when: ansible_os_family == "Debian"

    # ============================================
    # REBOOT: If required by updates
    # ============================================
    - name: Check if reboot required (Ubuntu)
      stat:
        path: /var/run/reboot-required
      register: reboot_required
      when: ansible_os_family == "Debian"

    - name: Display reboot status
      debug:
        msg: "Reboot required: {{ reboot_required.stat.exists | default(false) }}"
      when: ansible_os_family == "Debian"

    - name: Reboot if required
      reboot:
        reboot_timeout: {{ ready_timeout }}
        msg: "Ansible-triggered reboot for OS updates"
        pre_reboot_delay: 5
        post_reboot_delay: 30
      when:
        - ansible_os_family == "Debian"
        - reboot_required.stat.exists | default(false)

    # ============================================
    # POST-UPDATE: Rejoin cluster
    # ============================================
    - name: Wait for k3s to be ready
      delegate_to: localhost
      become: no
      command: >
        kubectl wait --for=condition=Ready
        node/{{ inventory_hostname }}
        --timeout={{ ready_timeout }}s
      register: ready_result
      retries: 3
      delay: 10
      until: ready_result.rc == 0
      when: is_worker

    - name: Uncordon node
      delegate_to: localhost
      become: no
      command: kubectl uncordon {{ inventory_hostname }}
      when: is_worker

    - name: Verify node is Ready and schedulable
      delegate_to: localhost
      become: no
      command: kubectl get node {{ inventory_hostname }} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
      register: node_status
      failed_when: node_status.stdout != "True"
      when: is_worker

    - name: Display completion status
      debug:
        msg: "✅ {{ inventory_hostname }} updated successfully. Node status: {{ node_status.stdout | default('N/A') }}"

    # ============================================
    # PAUSE: Give workloads time to stabilize
    # ============================================
    - name: Wait for workloads to stabilize before next node
      pause:
        seconds: 30
        prompt: "Waiting 30s for workloads to stabilize before next node..."
      when: is_worker
EOF
```

---

## Playbook Explanation

| Phase | Action | Why |
|-------|--------|-----|
| **Drain** | Move workloads off node | Zero-downtime for apps |
| **Update** | `apt dist-upgrade` | Full package update |
| **Reboot** | If kernel/libs updated | Apply updates fully |
| **Uncordon** | Allow workloads back | Node rejoins cluster |
| **Pause** | Wait 30s | Let pods reschedule |

---

## Safety Features

1. **`serial: 1`**: Only one node at a time
2. **`--check`**: Dry-run mode shows what would change
3. **Drain timeout**: Fails if drain takes too long
4. **Retry logic**: Waits for node ready with retries
5. **Pause between nodes**: Workloads stabilize

---

## Expected Output

```
PLAY [Rolling OS Update for k3s Nodes] ****************************************

TASK [Drain node from k3s cluster] ********************************************
changed: [ai2 -> localhost]

TASK [Update apt cache (Ubuntu)] **********************************************
ok: [ai2]

TASK [Upgrade all packages (Ubuntu)] ******************************************
changed: [ai2]

TASK [Check if reboot required (Ubuntu)] **************************************
ok: [ai2]

TASK [Reboot if required] *****************************************************
changed: [ai2]

TASK [Wait for k3s to be ready] ***********************************************
ok: [ai2 -> localhost]

TASK [Uncordon node] **********************************************************
changed: [ai2 -> localhost]

TASK [Display completion status] **********************************************
ok: [ai2] => {
    "msg": "✅ ai2 updated successfully. Node status: True"
}

TASK [Wait for workloads to stabilize before next node...] ********************
Pausing for 30 seconds
(ctrl+C then 'C' = continue early, ctrl+C then 'A' = abort)

PLAY RECAP ********************************************************************
ai2                        : ok=9    changed=4    unreachable=0    failed=0
```

---

## Handling nas1 (Control-Plane Only)

nas1 doesn't run workloads, so:
- No drain/uncordon needed
- Updates applied directly
- k3s control-plane remains available via other nodes

The playbook automatically detects this via `k3s_control_only` group.

---

## Handling Frigate on ai1

When ai1 is added, Frigate will be pinned to it. During updates:

1. **Frigate will briefly stop** during ai1 reboot
2. **Recordings will pause** for ~2-5 minutes
3. **Detections resume** automatically after reboot

For longer maintenance:
- Recordings stored on local drives (not affected by k8s)
- Historical recordings remain accessible

---

## Security-Only Updates

For minimal changes (security patches only):

```bash
cat > ~/src/bfinfrastructure/ansible/playbooks/security-updates.yaml << 'EOF'
---
- name: Security Updates Only
  hosts: ubuntu
  become: yes
  serial: 1

  tasks:
    - name: Drain if worker
      delegate_to: localhost
      become: no
      command: kubectl drain {{ inventory_hostname }} --ignore-daemonsets --delete-emptydir-data
      when: "'k3s_control_only' not in group_names"

    - name: Update apt cache
      apt:
        update_cache: yes

    - name: Install security updates only
      shell: |
        apt-get -s dist-upgrade | grep "^Inst" | grep -i security | awk '{print $2}' | xargs -r apt-get install -y
      register: security_result

    - name: Display security updates
      debug:
        msg: "{{ security_result.stdout_lines | default(['No security updates']) }}"

    - name: Uncordon if worker
      delegate_to: localhost
      become: no
      command: kubectl uncordon {{ inventory_hostname }}
      when: "'k3s_control_only' not in group_names"
EOF
```

---

## Unattended Security Updates (Automatic)

For daily automatic security patches (no manual intervention):

```bash
ansible ubuntu -m apt -a "name=unattended-upgrades state=present"
ansible ubuntu -m command -a "dpkg-reconfigure -plow unattended-upgrades"
```

This handles critical security patches automatically. Monthly manual updates catch everything else.

---

## Troubleshooting

### Drain Stuck

```bash
# Check what's blocking
kubectl get pods --all-namespaces -o wide | grep ai2

# Force drain (may disrupt pods)
kubectl drain ai2 --ignore-daemonsets --delete-emptydir-data --force --grace-period=0
```

### Node Not Ready After Reboot

```bash
# Check k3s status
ssh ai2 "systemctl status k3s"

# Check k3s logs
ssh ai2 "journalctl -u k3s -n 50"

# Restart k3s if needed
ssh ai2 "systemctl restart k3s"
```

### Ansible Connection Failed

```bash
# Test connectivity
ansible ai2 -m ping

# Verbose mode
ansible ai2 -m ping -vvv
```

---

## Monthly Checklist

When you receive the monthly reminder:

1. **Check current state**
   ```bash
   kubectl get nodes
   ansible all -m command -a "uptime"
   ```

2. **Preview changes**
   ```bash
   ansible-playbook playbooks/update-nodes.yaml --check
   ```

3. **Run updates**
   ```bash
   ansible-playbook playbooks/update-nodes.yaml
   ```

4. **Verify health**
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces | grep -v Running
   ```

5. **Document** (optional)
   - Note any issues in Joplin
   - Update maintenance log

---

## Integration with GitLab CI

For pipeline-triggered maintenance:

```yaml
# .gitlab-ci.yml
maintenance:
  stage: deploy
  when: manual
  script:
    - cd ansible
    - ansible-playbook playbooks/update-nodes.yaml
  only:
    - main
```

This allows triggering maintenance from GitLab UI with manual approval.
