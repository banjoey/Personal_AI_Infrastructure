# ManageClient Workflow

**Purpose:** Manage individual clients - block, rename, set fixed IP, kick, etc.

## Operations

### Block Client
Prevent a device from connecting to the network.

```
mcp__unifi__unifi_execute
  tool: "unifi_block_client"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    confirm: true
  }
```

### Unblock Client
Re-allow a previously blocked device.

```
mcp__unifi__unifi_execute
  tool: "unifi_unblock_client"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    confirm: true
  }
```

### List Blocked Clients
See all currently blocked devices.

```
mcp__unifi__unifi_execute
  tool: "unifi_list_blocked_clients"
  arguments: {}
```

### Rename Client
Change the display name of a client.

```
mcp__unifi__unifi_execute
  tool: "unifi_rename_client"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    name: "Joey's iPhone",
    confirm: true
  }
```

### Set Fixed IP (DHCP Reservation)
Assign a static IP address to a client.

```
mcp__unifi__unifi_execute
  tool: "unifi_set_client_ip_settings"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    use_fixedip: "true",
    fixed_ip: "10.0.0.50",
    confirm: true
  }
```

### Set Local DNS Record
Create a local hostname for the client.

```
mcp__unifi__unifi_execute
  tool: "unifi_set_client_ip_settings"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    local_dns_record_enabled: "true",
    local_dns_record: "mydevice.local",
    confirm: true
  }
```

### Force Reconnect (Kick)
Disconnect a client, forcing it to reconnect.

```
mcp__unifi__unifi_execute
  tool: "unifi_force_reconnect_client"
  arguments: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    confirm: true
  }
```

### Get Client Details
View full information about a client.

```
mcp__unifi__unifi_execute
  tool: "unifi_get_client_details"
  arguments: {mac_address: "aa:bb:cc:dd:ee:ff"}
```

### Get Client Statistics
View bandwidth and connection stats.

```
mcp__unifi__unifi_execute
  tool: "unifi_get_client_stats"
  arguments: {
    client_id: "client-id-here",
    duration: "24h"
  }
```

## Common Scenarios

### Block an Unknown Device
```
1. List clients to find suspicious device
2. Get client details to verify
3. Block the client
4. Document in Joplin
```

### Set Up a Server with Fixed IP
```
1. Find client MAC address
2. Set fixed IP in appropriate range
3. Optionally set local DNS record
4. Client may need to reconnect
```

### Troubleshoot Connection Issues
```
1. Get client details
2. Check signal strength, connection time
3. Force reconnect if needed
4. Verify connection restored
```

## Notes

- `confirm: true` is required for all write operations
- MAC addresses should be lowercase with colons (aa:bb:cc:dd:ee:ff)
- Fixed IPs must be in the same subnet as the client's network
- Local DNS requires UniFi Network 7.2+
