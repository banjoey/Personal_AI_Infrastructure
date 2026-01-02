# NetworkConfig Workflow

**Purpose:** Create and configure networks (LANs, VLANs) on the UniFi controller.

## List Networks

```
mcp__unifi__unifi_execute
  tool: "unifi_list_networks"
  arguments: {}
```

## Get Network Details

```
mcp__unifi__unifi_execute
  tool: "unifi_get_network_details"
  arguments: {network_id: "network-id-here"}
```

## Create Network

Use schema validation for network creation:

```
mcp__unifi__unifi_execute
  tool: "unifi_create_network"
  arguments: {
    network_data: {
      name: "IoT Network",
      purpose: "corporate",
      vlan: 20,
      subnet: "10.0.20.0/24",
      dhcp_enabled: true,
      dhcp_start: "10.0.20.100",
      dhcp_stop: "10.0.20.254",
      domain_name: "iot.local"
    },
    confirm: true
  }
```

### Network Data Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Network display name |
| `purpose` | string | "corporate" (LAN), "guest", "wan" |
| `vlan` | integer | VLAN ID (1-4094), omit for native |
| `subnet` | string | CIDR notation (e.g., "10.0.20.0/24") |
| `dhcp_enabled` | boolean | Enable DHCP server |
| `dhcp_start` | string | DHCP range start |
| `dhcp_stop` | string | DHCP range end |
| `domain_name` | string | Local domain for DHCP clients |
| `igmp_snooping` | boolean | Enable IGMP snooping |

## Update Network

```
mcp__unifi__unifi_execute
  tool: "unifi_update_network"
  arguments: {
    network_id: "network-id-here",
    update_data: {
      dhcp_start: "10.0.20.50",
      dhcp_stop: "10.0.20.200"
    },
    confirm: true
  }
```

## Common Network Configurations

### Main/Default Network
```json
{
  "name": "Default",
  "purpose": "corporate",
  "subnet": "10.0.0.0/24",
  "dhcp_enabled": true,
  "dhcp_start": "10.0.0.100",
  "dhcp_stop": "10.0.0.254"
}
```

### IoT Network (Isolated)
```json
{
  "name": "IoT",
  "purpose": "corporate",
  "vlan": 20,
  "subnet": "10.0.20.0/24",
  "dhcp_enabled": true,
  "dhcp_start": "10.0.20.100",
  "dhcp_stop": "10.0.20.254",
  "domain_name": "iot.local"
}
```

### Guest Network
```json
{
  "name": "Guest",
  "purpose": "guest",
  "vlan": 30,
  "subnet": "10.0.30.0/24",
  "dhcp_enabled": true,
  "dhcp_start": "10.0.30.100",
  "dhcp_stop": "10.0.30.254"
}
```

### Management Network
```json
{
  "name": "Management",
  "purpose": "corporate",
  "vlan": 99,
  "subnet": "10.0.99.0/24",
  "dhcp_enabled": true,
  "dhcp_start": "10.0.99.100",
  "dhcp_stop": "10.0.99.200"
}
```

## Network Health

Check overall network status:

```
mcp__unifi__unifi_execute
  tool: "unifi_get_network_health"
  arguments: {}
```

## Network Statistics

Get bandwidth and usage stats:

```
mcp__unifi__unifi_execute
  tool: "unifi_get_network_stats"
  arguments: {duration: "24h"}
```

## Related Workflows

After creating a network, you may need to:
1. **WlanConfig** - Create WiFi SSID for the new network
2. **FirewallConfig** - Set up inter-VLAN firewall rules

## Notes

- VLAN IDs 1-4094 are valid
- Omit `vlan` field for native/untagged network
- Changes may require client reconnection
- Always verify with `unifi_list_networks` after changes
