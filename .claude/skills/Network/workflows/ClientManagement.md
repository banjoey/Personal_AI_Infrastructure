# ClientManagement Workflow

**Purpose:** View, manage, and control network clients (connected devices).

## Execution Steps

1. **Determine operation type**
   - List all clients
   - List clients by network/VLAN
   - Block/unblock specific client
   - Rename client
   - View client details

2. **Delegate to vendor skill**
   - For Unifi: Use appropriate `mcp__unifi__unifi_execute` tool
   - `unifi_list_clients` - Get all connected clients
   - `unifi_get_client` - Get specific client details
   - `unifi_block_client` / `unifi_unblock_client` - Access control

3. **Format results**
   - Show: Name, IP, MAC, Network, Connection Type (wired/wireless)
   - Include: Signal strength, bandwidth usage, connection time
   - Group by: Network/VLAN or connection type

## Operations

### List Clients
```
User: "Who's connected to my network?"
→ Call unifi_list_clients
→ Format as table with name, IP, connection type
```

### Block Device
```
User: "Block the device with MAC xx:xx:xx:xx:xx:xx"
→ Call unifi_block_client with MAC address
→ Confirm block applied
```

### Client Details
```
User: "Tell me about this device"
→ Call unifi_get_client with MAC
→ Show full device history and statistics
```

## Example Output

```
Connected Clients (36 total)
============================

Wired (8):
- Desktop-Office (10.0.0.50) - 1.2 Gbps
- NAS (10.0.0.100) - 1.0 Gbps
- SmartTV-Living (10.0.0.120) - 100 Mbps

Wireless (28):
- iPhone-Joey (10.0.0.150) - 5GHz, -45dBm, 866 Mbps
- MacBook-Pro (10.0.0.151) - 5GHz, -52dBm, 1200 Mbps
- [... more clients ...]
```

## Delegation

This workflow delegates to:
- **Unifi Skill** → Client management MCP tools
