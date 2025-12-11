# ListClients Workflow

**Purpose:** List clients connected to the UniFi network with connection details.

## Execution Steps

1. **Call the MCP tool**
   ```
   mcp__unifi__unifi_execute
     tool: "unifi_list_clients"
     arguments: {}
   ```

2. **Optional filters**
   - `filter_type`: "wired" or "wireless"
   - `include_offline`: Include recently disconnected clients
   - `limit`: Maximum number to return

3. **Format output**
   - Group by connection type (wired/wireless)
   - Show: Name, IP, MAC, Connection details
   - Include signal strength for wireless

## Example Calls

### List all connected clients
```
mcp__unifi__unifi_execute
  tool: "unifi_list_clients"
  arguments: {}
```

### List wireless clients only
```
mcp__unifi__unifi_execute
  tool: "unifi_list_clients"
  arguments: {filter_type: "wireless"}
```

### Include offline clients
```
mcp__unifi__unifi_execute
  tool: "unifi_list_clients"
  arguments: {include_offline: true}
```

### Get specific client details
```
mcp__unifi__unifi_execute
  tool: "unifi_get_client_details"
  arguments: {mac_address: "aa:bb:cc:dd:ee:ff"}
```

### Top bandwidth users
```
mcp__unifi__unifi_execute
  tool: "unifi_get_top_clients"
  arguments: {limit: 10, duration: "24h"}
```

## Output Format

```
Connected Clients (36 total)
============================

Wired (8):
Name                 IP              MAC                Speed
-------------------- --------------- ------------------ --------
Desktop-Office       10.0.0.50       aa:bb:cc:dd:ee:01  1 Gbps
NAS                  10.0.0.100      aa:bb:cc:dd:ee:02  1 Gbps
SmartTV-Living       10.0.0.120      aa:bb:cc:dd:ee:03  100 Mbps

Wireless (28):
Name                 IP              MAC                AP           Signal  Speed
-------------------- --------------- ------------------ ------------ ------- --------
iPhone-Joey          10.0.0.150      aa:bb:cc:dd:ee:10  U6-LR-Living -45 dBm 866 Mbps
MacBook-Pro          10.0.0.151      aa:bb:cc:dd:ee:11  U6-LR-Office -52 dBm 1.2 Gbps
iPad                 10.0.0.152      aa:bb:cc:dd:ee:12  U6-LR-Living -48 dBm 400 Mbps
```

## Related Tools

| Tool | Use For |
|------|---------|
| `unifi_get_client_details` | Full client info |
| `unifi_get_client_stats` | Client statistics |
| `unifi_block_client` | Block from network |
| `unifi_rename_client` | Change client name |
| `unifi_force_reconnect_client` | Kick client |
| `unifi_set_client_ip_settings` | Fixed IP/DNS |
