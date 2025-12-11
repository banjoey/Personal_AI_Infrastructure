# FirewallConfig Workflow

**Purpose:** Configure firewall policies and rules on the UniFi controller.

## List Firewall Policies

```
mcp__unifi__unifi_execute
  tool: "unifi_list_firewall_policies"
  arguments: {}
```

With predefined rules:
```
mcp__unifi__unifi_execute
  tool: "unifi_list_firewall_policies"
  arguments: {include_predefined: true}
```

## Get Policy Details

```
mcp__unifi__unifi_execute
  tool: "unifi_get_firewall_policy_details"
  arguments: {policy_id: "policy-id-here"}
```

## Create Firewall Policy (Simple)

The simplified interface is recommended:

```
mcp__unifi__unifi_execute
  tool: "unifi_create_simple_firewall_policy"
  arguments: {
    policy: {
      name: "Block IoT to Main",
      action: "drop",
      src: "iot-network",
      dst: "main-network",
      protocol: "all"
    },
    confirm: true
  }
```

### Simple Policy Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Rule description |
| `action` | string | "accept", "drop", "reject" |
| `src` | string | Source (network name, IP, "any") |
| `dst` | string | Destination (network name, IP, "any") |
| `protocol` | string | "all", "tcp", "udp", "icmp" |
| `port` | string | Port number or range |
| `enabled` | boolean | Enable/disable rule |

## Create Firewall Policy (Full)

For complex rules, use the full schema:

```
mcp__unifi__unifi_execute
  tool: "unifi_create_firewall_policy"
  arguments: {
    policy_data: {
      name: "Block IoT to Main",
      ruleset: "LAN_IN",
      action: "drop",
      protocol: "all",
      src_address: "10.0.20.0/24",
      dst_address: "10.0.0.0/24",
      enabled: true,
      index: 2000
    },
    confirm: true
  }
```

## Update Policy

```
mcp__unifi__unifi_execute
  tool: "unifi_update_firewall_policy"
  arguments: {
    policy_id: "policy-id-here",
    update_data: {
      enabled: false
    },
    confirm: true
  }
```

## Toggle Policy (Enable/Disable)

```
mcp__unifi__unifi_execute
  tool: "unifi_toggle_firewall_policy"
  arguments: {
    policy_id: "policy-id-here",
    confirm: true
  }
```

## List Firewall Zones

```
mcp__unifi__unifi_execute
  tool: "unifi_list_firewall_zones"
  arguments: {}
```

## List IP Groups

```
mcp__unifi__unifi_execute
  tool: "unifi_list_ip_groups"
  arguments: {}
```

## Common Firewall Scenarios

### Block VLAN from Accessing Another VLAN
```json
{
  "name": "Block IoT to Main",
  "action": "drop",
  "src": "10.0.20.0/24",
  "dst": "10.0.0.0/24",
  "protocol": "all"
}
```

### Allow Specific Device to Cross VLANs
```json
{
  "name": "Allow Smart Speaker to Media Server",
  "action": "accept",
  "src": "10.0.20.50",
  "dst": "10.0.0.100",
  "protocol": "tcp",
  "port": "8096"
}
```

### Block Guest from All Private IPs
```json
{
  "name": "Guest Isolation",
  "action": "drop",
  "src": "10.0.30.0/24",
  "dst": "10.0.0.0/8",
  "protocol": "all"
}
```

### Allow Established/Related
```json
{
  "name": "Allow Established Back",
  "action": "accept",
  "state": "established,related",
  "dst": "10.0.20.0/24"
}
```

## Ruleset Types

| Ruleset | Description |
|---------|-------------|
| `LAN_IN` | Traffic from LAN entering router |
| `LAN_OUT` | Traffic from router to LAN |
| `LAN_LOCAL` | Traffic to router itself |
| `WAN_IN` | Inbound from internet |
| `WAN_OUT` | Outbound to internet |
| `GUEST_IN` | Traffic from guest network |
| `GUEST_OUT` | Traffic to guest network |

## Rule Order

- Rules are processed in order by index
- Lower index = higher priority
- First match wins
- Predefined rules have fixed indices

## Best Practices

1. **Default deny between VLANs** - Block all, then allow specific
2. **Allow established first** - Don't break return traffic
3. **Document every rule** - Use descriptive names
4. **Test after changes** - Verify connectivity
5. **Review periodically** - Remove unused rules

## Notes

- `confirm: true` required for all changes
- Changes apply immediately
- Test thoroughly before leaving
- Can disable rules instead of deleting for troubleshooting
