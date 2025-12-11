---
name: Unifi
description: UniFi network device management via MCP. USE WHEN user needs to manage UniFi devices, access points, clients, VLANs, firewall rules, WiFi networks, or any UniFi controller operations. Provides 81 MCP tools for complete network control.
---

# Unifi

Vendor-specific skill for managing UniFi network infrastructure via MCP tools. Called by the Network skill for UniFi-specific operations.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Unifi
```

| Workflow | Trigger | File |
|----------|---------|------|
| **ListDevices** | "show UniFi devices", "what APs do I have" | `workflows/ListDevices.md` |
| **ListClients** | "show connected clients", "who's on WiFi" | `workflows/ListClients.md` |
| **ManageClient** | "block device", "rename client", "fixed IP" | `workflows/ManageClient.md` |
| **NetworkConfig** | "create VLAN", "configure network" | `workflows/NetworkConfig.md` |
| **WlanConfig** | "create WiFi", "change SSID", "wireless settings" | `workflows/WlanConfig.md` |
| **FirewallConfig** | "firewall rule", "block traffic" | `workflows/FirewallConfig.md` |

## Examples

**Example 1: List all network devices**
```
User: "What UniFi devices do I have?"
→ Invokes ListDevices workflow
→ Calls mcp__unifi__unifi_execute with tool: "unifi_list_devices"
→ Returns: Device inventory with names, IPs, models, and status
```

**Example 2: Block a device**
```
User: "Block the device with MAC aa:bb:cc:dd:ee:ff"
→ Invokes ManageClient workflow
→ Calls mcp__unifi__unifi_execute with tool: "unifi_block_client", arguments: {mac_address: "aa:bb:cc:dd:ee:ff", confirm: true}
→ Returns: Confirmation that device is blocked
```

**Example 3: Create a new WiFi network**
```
User: "Create a guest WiFi network"
→ Invokes WlanConfig workflow
→ Gathers SSID name, password, VLAN
→ Calls mcp__unifi__unifi_execute with tool: "unifi_create_wlan"
→ Returns: New SSID created and broadcasting
```

## MCP Tool Usage

### How to Execute UniFi Tools

All UniFi operations use the MCP execute pattern:

```
mcp__unifi__unifi_execute
  tool: "tool_name"
  arguments: { ... }
```

### Discovery Pattern

1. **First:** Call `mcp__unifi__unifi_tool_index` to see all 81 available tools
2. **Then:** Call `mcp__unifi__unifi_execute` with the specific tool

### Batch Operations

For multiple operations, use batch execution:

```
mcp__unifi__unifi_batch
  operations: [
    {tool: "unifi_list_devices", arguments: {}},
    {tool: "unifi_list_clients", arguments: {}}
  ]
```

Then check status with `mcp__unifi__unifi_batch_status`.

## MCP Tools Available (81 Total)

### Device Management
| Tool | Description |
|------|-------------|
| `unifi_list_devices` | List all adopted devices (APs, switches, gateway) |
| `unifi_get_device_details` | Get details for specific device by MAC |
| `unifi_get_device_stats` | Get statistics for a device |
| `unifi_adopt_device` | Adopt a pending device |
| `unifi_reboot_device` | Reboot a device |
| `unifi_rename_device` | Rename a device |
| `unifi_upgrade_device` | Initiate firmware upgrade |

### Client Management
| Tool | Description |
|------|-------------|
| `unifi_list_clients` | List connected clients (filter: wired/wireless) |
| `unifi_get_client_details` | Get details for specific client by MAC |
| `unifi_get_client_stats` | Get client statistics |
| `unifi_block_client` | Block client from network |
| `unifi_unblock_client` | Unblock a blocked client |
| `unifi_list_blocked_clients` | List all blocked clients |
| `unifi_rename_client` | Rename a client |
| `unifi_force_reconnect_client` | Kick client (force reconnect) |
| `unifi_set_client_ip_settings` | Set fixed IP or local DNS |
| `unifi_get_top_clients` | Top clients by bandwidth usage |

### Network Configuration
| Tool | Description |
|------|-------------|
| `unifi_list_networks` | List all networks (LAN/VLAN) |
| `unifi_get_network_details` | Get network details by ID |
| `unifi_create_network` | Create new network/VLAN |
| `unifi_update_network` | Update network settings |
| `unifi_get_network_health` | Network health summary |
| `unifi_get_network_stats` | Network statistics |

### Wireless (WLAN)
| Tool | Description |
|------|-------------|
| `unifi_list_wlans` | List all WiFi networks |
| `unifi_get_wlan_details` | Get WLAN details by ID |
| `unifi_create_wlan` | Create new WiFi network |
| `unifi_update_wlan` | Update WLAN settings |

### Firewall & Security
| Tool | Description |
|------|-------------|
| `unifi_list_firewall_policies` | List firewall policies |
| `unifi_get_firewall_policy_details` | Get policy details |
| `unifi_create_firewall_policy` | Create firewall policy |
| `unifi_create_simple_firewall_policy` | Create policy (simplified) |
| `unifi_update_firewall_policy` | Update existing policy |
| `unifi_toggle_firewall_policy` | Enable/disable policy |
| `unifi_list_firewall_zones` | List firewall zones |
| `unifi_list_ip_groups` | List IP groups |

### Port Forwarding
| Tool | Description |
|------|-------------|
| `unifi_list_port_forwards` | List port forwarding rules |
| `unifi_get_port_forward` | Get specific rule |
| `unifi_create_port_forward` | Create port forward |
| `unifi_create_simple_port_forward` | Create (simplified) |
| `unifi_update_port_forward` | Update rule |
| `unifi_toggle_port_forward` | Enable/disable rule |

### Routing
| Tool | Description |
|------|-------------|
| `unifi_list_routes` | List static routes |
| `unifi_list_active_routes` | List active routing table |
| `unifi_get_route_details` | Get route details |
| `unifi_create_route` | Create static route |
| `unifi_update_route` | Update route |
| `unifi_list_traffic_routes` | List traffic/policy routes |
| `unifi_get_traffic_route_details` | Get traffic route details |
| `unifi_toggle_traffic_route` | Enable/disable traffic route |
| `unifi_update_traffic_route` | Update traffic route |

### QoS
| Tool | Description |
|------|-------------|
| `unifi_list_qos_rules` | List QoS rules |
| `unifi_get_qos_rule_details` | Get QoS rule details |
| `unifi_create_qos_rule` | Create QoS rule |
| `unifi_create_simple_qos_rule` | Create (simplified) |
| `unifi_update_qos_rule` | Update QoS rule |
| `unifi_toggle_qos_rule_enabled` | Enable/disable rule |

### VPN
| Tool | Description |
|------|-------------|
| `unifi_list_vpn_clients` | List VPN clients |
| `unifi_get_vpn_client_details` | Get VPN client details |
| `unifi_update_vpn_client_state` | Enable/disable VPN client |
| `unifi_list_vpn_servers` | List VPN servers |
| `unifi_get_vpn_server_details` | Get VPN server details |
| `unifi_update_vpn_server_state` | Enable/disable VPN server |

### Guest Network & Vouchers
| Tool | Description |
|------|-------------|
| `unifi_authorize_guest` | Authorize guest access |
| `unifi_unauthorize_guest` | Revoke guest authorization |
| `unifi_list_vouchers` | List hotspot vouchers |
| `unifi_get_voucher_details` | Get voucher details |
| `unifi_create_voucher` | Create voucher(s) |
| `unifi_revoke_voucher` | Revoke voucher |

### User Groups (Bandwidth Profiles)
| Tool | Description |
|------|-------------|
| `unifi_list_usergroups` | List user groups |
| `unifi_get_usergroup_details` | Get group details |
| `unifi_create_usergroup` | Create user group |
| `unifi_update_usergroup` | Update group |

### System & Monitoring
| Tool | Description |
|------|-------------|
| `unifi_get_system_info` | Controller version, uptime |
| `unifi_get_site_settings` | Site configuration |
| `unifi_get_dpi_stats` | Deep packet inspection stats |
| `unifi_get_alerts` | Recent alerts |
| `unifi_list_alarms` | Active alarms |
| `unifi_archive_alarm` | Dismiss specific alarm |
| `unifi_archive_all_alarms` | Dismiss all alarms |
| `unifi_list_events` | System events |
| `unifi_get_event_types` | Available event type filters |

## Controller Details

### BF Infrastructure
- **Device:** UniFi Cloud Gateway Max (UCG Max)
- **IP:** 10.0.0.1
- **Site:** default
- **Controller Type:** UniFi OS (requires `UNIFI_CONTROLLER_TYPE=proxy`)

### Authentication
- Uses local admin account `charles` (no MFA)
- Cloud accounts with MFA don't work with aiounifi API
- Credentials in `~/.config/.env`

### MCP Configuration
Located at project root: `bfinfrastructure/.mcp.json`
```json
{
  "mcpServers": {
    "unifi": {
      "command": "uv",
      "args": ["--directory", "/path/to/unifi-network-mcp", "run", "python", "-m", "src.main"]
    }
  }
}
```

## Integration

- **Network Skill:** Orchestrator that delegates to this skill
- **Joplin:** Documentation for network diagrams and policies

## Common Operations

### Quick Device Check
```
mcp__unifi__unifi_execute
  tool: "unifi_list_devices"
  arguments: {}
```

### Quick Client List
```
mcp__unifi__unifi_execute
  tool: "unifi_list_clients"
  arguments: {include_offline: false, limit: 50}
```

### Block a Device
```
mcp__unifi__unifi_execute
  tool: "unifi_block_client"
  arguments: {mac_address: "aa:bb:cc:dd:ee:ff", confirm: true}
```

### Network Health Check
```
mcp__unifi__unifi_execute
  tool: "unifi_get_network_health"
  arguments: {}
```
