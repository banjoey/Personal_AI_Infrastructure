# WlanConfig Workflow

**Purpose:** Create and configure WiFi networks (WLANs/SSIDs) on the UniFi controller.

## List WLANs

```
mcp__unifi__unifi_execute
  tool: "unifi_list_wlans"
  arguments: {}
```

## Get WLAN Details

```
mcp__unifi__unifi_execute
  tool: "unifi_get_wlan_details"
  arguments: {wlan_id: "wlan-id-here"}
```

## Create WLAN

```
mcp__unifi__unifi_execute
  tool: "unifi_create_wlan"
  arguments: {
    wlan_data: {
      name: "MyNetwork",
      security: "wpapsk",
      wpa_mode: "wpa2",
      x_passphrase: "SecurePassword123",
      networkconf_id: "network-id-for-vlan"
    },
    confirm: true
  }
```

### WLAN Data Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | SSID name (what users see) |
| `security` | string | "wpapsk", "wpa3", "open" |
| `wpa_mode` | string | "wpa2", "wpa3", "wpa2wpa3" |
| `x_passphrase` | string | WiFi password |
| `networkconf_id` | string | Network/VLAN to assign |
| `enabled` | boolean | Enable/disable SSID |
| `hide_ssid` | boolean | Hidden network |
| `is_guest` | boolean | Guest network features |
| `ap_group_ids` | array | Which APs broadcast this |
| `wlan_band` | string | "both", "2g", "5g" |
| `uapsd_enabled` | boolean | Power save for mobile |
| `fast_roaming_enabled` | boolean | 802.11r fast roaming |
| `pmf_mode` | string | Protected mgmt frames |

## Update WLAN

```
mcp__unifi__unifi_execute
  tool: "unifi_update_wlan"
  arguments: {
    wlan_id: "wlan-id-here",
    update_data: {
      x_passphrase: "NewPassword456"
    },
    confirm: true
  }
```

## Common WLAN Configurations

### Main Home Network
```json
{
  "name": "HomeNetwork",
  "security": "wpapsk",
  "wpa_mode": "wpa2wpa3",
  "x_passphrase": "SecureHomePassword",
  "wlan_band": "both",
  "fast_roaming_enabled": true,
  "uapsd_enabled": true
}
```

### IoT Network (2.4GHz Only)
```json
{
  "name": "HomeNetwork-IoT",
  "security": "wpapsk",
  "wpa_mode": "wpa2",
  "x_passphrase": "IoTPassword",
  "networkconf_id": "iot-network-id",
  "wlan_band": "2g",
  "hide_ssid": false
}
```

### Guest Network
```json
{
  "name": "HomeNetwork-Guest",
  "security": "wpapsk",
  "wpa_mode": "wpa2",
  "x_passphrase": "GuestPassword",
  "networkconf_id": "guest-network-id",
  "is_guest": true,
  "l2_isolation": true
}
```

### High Security Network (WPA3 Only)
```json
{
  "name": "SecureNetwork",
  "security": "wpa3",
  "wpa_mode": "wpa3",
  "x_passphrase": "VerySecurePassword",
  "pmf_mode": "required"
}
```

## Security Modes

| Mode | Description | Compatibility |
|------|-------------|---------------|
| `wpa2` | WPA2 Personal | Most compatible |
| `wpa3` | WPA3 Personal | Modern devices only |
| `wpa2wpa3` | Transitional | Best of both |
| `open` | No security | Guest/public |

## Band Options

| Option | Description |
|--------|-------------|
| `both` | 2.4GHz and 5GHz |
| `2g` | 2.4GHz only (IoT) |
| `5g` | 5GHz only (performance) |

## Common Operations

### Change WiFi Password
```
mcp__unifi__unifi_execute
  tool: "unifi_update_wlan"
  arguments: {
    wlan_id: "wlan-id-here",
    update_data: {x_passphrase: "NewPassword"},
    confirm: true
  }
```

### Disable SSID Temporarily
```
mcp__unifi__unifi_execute
  tool: "unifi_update_wlan"
  arguments: {
    wlan_id: "wlan-id-here",
    update_data: {enabled: false},
    confirm: true
  }
```

### Hide Network
```
mcp__unifi__unifi_execute
  tool: "unifi_update_wlan"
  arguments: {
    wlan_id: "wlan-id-here",
    update_data: {hide_ssid: true},
    confirm: true
  }
```

## Notes

- Get `networkconf_id` from `unifi_list_networks` output
- Password changes take effect immediately
- Clients will need to reconnect after password change
- WPA3 requires compatible client devices
- 2.4GHz band is better for IoT device compatibility
