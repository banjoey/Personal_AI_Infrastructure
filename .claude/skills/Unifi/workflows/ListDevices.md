# ListDevices Workflow

**Purpose:** List all UniFi network devices (gateway, APs, switches) with their status.

## Execution Steps

1. **Call the MCP tool**
   ```
   mcp__unifi__unifi_execute
     tool: "unifi_list_devices"
     arguments: {}
   ```

2. **Optional filters**
   - `device_type`: Filter by "uap" (APs), "usw" (switches), "ugw" (gateway)
   - `status`: Filter by "online", "offline", "pending"
   - `include_details`: Get full device details (default: false)

3. **Format output**
   - Group by device type
   - Show: Name, Model, IP, MAC, Status, Uptime
   - Highlight devices needing attention

## Example Calls

### List all devices
```
mcp__unifi__unifi_execute
  tool: "unifi_list_devices"
  arguments: {}
```

### List only access points
```
mcp__unifi__unifi_execute
  tool: "unifi_list_devices"
  arguments: {device_type: "uap"}
```

### Get detailed device info
```
mcp__unifi__unifi_execute
  tool: "unifi_get_device_details"
  arguments: {mac_address: "aa:bb:cc:dd:ee:ff"}
```

### Get device statistics
```
mcp__unifi__unifi_execute
  tool: "unifi_get_device_stats"
  arguments: {device_id: "device-id-here", duration: "24h"}
```

## Output Format

```
UniFi Devices (5 total)
=======================

Gateway:
- UCG Max (10.0.0.1) - Online, Uptime: 45d 12h
  Model: UCG-Max, Firmware: 4.0.6

Access Points (3):
- U6-LR-Living (10.0.0.10) - Online, 23 clients
  Model: U6-LR, Channel: 36/1, Firmware: 7.0.66
- U6-LR-Office (10.0.0.11) - Online, 8 clients
  Model: U6-LR, Channel: 149/6, Firmware: 7.0.66
- U6-LR-Garage (10.0.0.12) - Online, 5 clients
  Model: U6-LR, Channel: 44/11, Firmware: 7.0.66

Switches:
- [none]

All devices online and healthy.
```

## Related Tools

| Tool | Use For |
|------|---------|
| `unifi_get_device_details` | Full device configuration |
| `unifi_get_device_stats` | Performance metrics |
| `unifi_reboot_device` | Restart a device |
| `unifi_rename_device` | Change device name |
| `unifi_upgrade_device` | Firmware update |
