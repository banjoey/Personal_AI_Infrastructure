# Inventory Workflow

**Purpose:** Enumerate and display all network devices with their status and roles.

## Execution Steps

1. **Load vendor skill based on infrastructure**
   - For UniFi networks: Use Unifi skill
   - Check which vendor skills are available

2. **Gather device information**
   - Delegate to vendor skill for device enumeration
   - For Unifi: Use `mcp__unifi__unifi_execute` with `unifi_list_devices`

3. **Enrich with context**
   - Add device roles (router, switch, AP, etc.)
   - Include connection status
   - Note any devices needing attention

4. **Format output**
   - Group by device type
   - Show: Name, IP, MAC, Model, Status, Uptime
   - Highlight any issues or warnings

## Example Output

```
Network Inventory (UniFi)
========================

Router/Gateway:
- UCG Max (10.0.0.1) - Online, Uptime: 45 days

Access Points:
- U6-LR Living Room (10.0.0.10) - Online, 23 clients
- U6-LR Office (10.0.0.11) - Online, 8 clients
- U6-LR Garage (10.0.0.12) - Online, 5 clients

Switches:
- [none detected]

Total: 4 devices, all online
```

## Delegation

This workflow delegates to:
- **Unifi Skill** → `mcp__unifi__unifi_execute` with `unifi_list_devices`
