# WifiManagement Workflow

**Purpose:** Configure and manage WiFi networks (SSIDs) and wireless settings.

## Execution Steps

1. **Determine operation**
   - Create new WiFi network
   - Modify existing network
   - View WiFi status
   - Optimize wireless settings

2. **Gather requirements** (for new/modified networks)
   - SSID name
   - Security type (WPA2, WPA3)
   - Password
   - Associated VLAN
   - Band steering preferences
   - Hidden network?

3. **Delegate to vendor skill**
   - For Unifi: Use WLAN MCP tools
   - Configure AP settings

4. **Verify deployment**
   - Check SSID is broadcasting
   - Test client connectivity

## WiFi Network Types

### Main Network
```
SSID: HomeNetwork
Security: WPA3/WPA2
VLAN: Default (1)
Bands: 2.4GHz + 5GHz
Band Steering: Prefer 5GHz
```

### IoT Network
```
SSID: HomeNetwork-IoT
Security: WPA2 (for compatibility)
VLAN: 20
Bands: 2.4GHz only (IoT compatibility)
Hidden: Optional
```

### Guest Network
```
SSID: HomeNetwork-Guest
Security: WPA2
VLAN: 30
Bands: 2.4GHz + 5GHz
Client Isolation: Enabled
```

## Wireless Optimization

### Channel Selection
- 2.4GHz: Channels 1, 6, or 11 only
- 5GHz: Use DFS channels if available
- Let controller auto-optimize when possible

### Transmit Power
- High density: Lower power, more APs
- Sparse coverage: Higher power

### Band Steering
- Prefer 5GHz for capable devices
- Keep 2.4GHz for IoT and legacy devices

## Common Operations

### View WiFi Status
```
User: "How are my WiFi networks doing?"
→ List all SSIDs
→ Show client count per network
→ Display channel utilization
→ Report any issues
```

### Create Guest Network
```
User: "Set up a guest WiFi"
→ Create SSID with guest VLAN
→ Enable client isolation
→ Set bandwidth limits
→ Configure portal (optional)
```

### Optimize Channels
```
User: "WiFi seems slow"
→ Analyze channel utilization
→ Check for interference
→ Recommend/apply channel changes
```

## Delegation

This workflow delegates to:
- **Unifi Skill** → WLAN configuration via MCP
