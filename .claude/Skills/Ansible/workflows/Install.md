# Install Workflow

Installs Ansible on macOS and sets up the infrastructure automation environment.

---

## Prerequisites

- Homebrew installed
- SSH access to target nodes
- Python 3 on target nodes

---

## Step 1: Install Ansible on Mac

```bash
brew install ansible
```

Verify installation:

```bash
ansible --version
```

---

## Step 2: Create Project Structure

```bash
cd ~/src/bfinfrastructure

mkdir -p ansible/{inventory,playbooks,roles,group_vars}
```

---

## Step 3: Create ansible.cfg

```bash
cat > ansible/ansible.cfg << 'EOF'
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
EOF
```

---

## Step 4: Create Inventory

```bash
cat > ansible/inventory/hosts.ini << 'EOF'
[k3s_servers]
ai2 ansible_host=10.0.20.22
# ai1 ansible_host=10.0.20.21  # Uncomment after ai1 rebuild

[k3s_control_only]
nas1 ansible_host=10.0.20.15

[k3s:children]
k3s_servers
k3s_control_only

[ubuntu]
ai2
# ai1  # Uncomment after ai1 rebuild

[unraid]
nas1

[all:vars]
ansible_user=root
ansible_python_interpreter=/usr/bin/python3
EOF
```

---

## Step 5: Create Group Variables

```bash
cat > ansible/group_vars/all.yaml << 'EOF'
---
# Common variables for all hosts
timezone: America/Los_Angeles
ntp_servers:
  - time.cloudflare.com
  - time.google.com
EOF

cat > ansible/group_vars/ubuntu.yaml << 'EOF'
---
# Ubuntu-specific variables
package_manager: apt
EOF

cat > ansible/group_vars/unraid.yaml << 'EOF'
---
# Unraid-specific variables
package_manager: slackpkg
ansible_python_interpreter: /usr/bin/python3
EOF
```

---

## Step 6: Test Connectivity

```bash
cd ~/src/bfinfrastructure/ansible
ansible all -m ping
```

Expected output:
```
ai2 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
nas1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

---

## Step 7: Create Initial Playbooks

See `workflows/RollingUpgrade.md` for the main maintenance playbook.

---

## Step 8: Set Up Monthly Reminder

Choose one method:

### Option A: macOS Calendar Reminder

```bash
# Add to Calendar app manually
# Title: "Monthly k3s Maintenance"
# Repeat: Monthly on the 1st
# Alert: 9:00 AM
```

### Option B: Joplin Recurring Todo

Create a todo in Joplin Charles Projects notebook:
- Title: "Monthly k3s Node Maintenance"
- Set as recurring (1st of each month)
- Tag: maintenance, infrastructure

### Option C: Cron + Notification (macOS)

```bash
# Add to crontab
crontab -e

# Add this line (9 AM on 1st of each month)
0 9 1 * * osascript -e 'display notification "Time for monthly k3s node maintenance! Run: cd ~/src/bfinfrastructure/ansible && ansible-playbook playbooks/update-nodes.yaml" with title "🔧 Infrastructure Reminder"'
```

### Option D: Discord Webhook (Best for Visibility)

1. Create Discord webhook in your server
2. Create reminder script:

```bash
cat > ~/src/bfinfrastructure/ansible/monthly-reminder.sh << 'EOF'
#!/bin/bash
# Monthly infrastructure maintenance reminder
# Add to cron: 0 9 1 * * ~/src/bfinfrastructure/ansible/monthly-reminder.sh

DISCORD_WEBHOOK="${DISCORD_MAINTENANCE_WEBHOOK}"

curl -X POST "$DISCORD_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "🔧 Monthly Infrastructure Maintenance",
      "description": "Time to update your k3s nodes!",
      "color": 5814783,
      "fields": [
        {"name": "Command", "value": "```bash\ncd ~/src/bfinfrastructure/ansible\nansible-playbook playbooks/update-nodes.yaml\n```", "inline": false},
        {"name": "Nodes", "value": "ai2, ai1, nas1", "inline": true},
        {"name": "Estimated Time", "value": "15-30 min", "inline": true}
      ],
      "footer": {"text": "Run --check first to preview changes"}
    }]
  }'
EOF

chmod +x ~/src/bfinfrastructure/ansible/monthly-reminder.sh
```

3. Add to cron:
```bash
crontab -e
# Add: 0 9 1 * * ~/src/bfinfrastructure/ansible/monthly-reminder.sh
```

---

## Step 9: Verify Setup

```bash
cd ~/src/bfinfrastructure/ansible

# Check inventory
ansible-inventory --list

# Gather facts from all nodes
ansible all -m setup --tree /tmp/facts

# Test a simple command
ansible ubuntu -m command -a "uptime"
```

---

## Troubleshooting

### SSH Connection Failed

```bash
# Verify SSH access manually
ssh root@10.0.20.22

# Check SSH key
ssh-add -l

# Add key if needed
ssh-add ~/.ssh/id_ed25519
```

### Python Not Found on Target

```bash
# Install Python on Ubuntu
ansible ai2 -m raw -a "apt update && apt install -y python3"

# For Unraid, Python should be pre-installed
```

### Permission Denied

```bash
# Ensure root access or sudo configured
ansible ai2 -m command -a "whoami" --become
```

---

## Next Steps

1. Create maintenance playbooks (`workflows/RollingUpgrade.md`)
2. Set up the monthly reminder
3. Commit ansible/ directory to Git
4. Test with `--check` before first real run
