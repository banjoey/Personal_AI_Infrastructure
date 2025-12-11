# Troubleshoot Workflow

**Purpose:** Diagnose and resolve network connectivity issues.

## Execution Steps

1. **Gather symptoms**
   - What device is affected?
   - What's not working? (internet, LAN, specific service)
   - When did it start?
   - Any recent changes?

2. **Systematic diagnosis**
   - Check device status in controller
   - Verify network connectivity
   - Test DNS resolution
   - Check gateway/internet connectivity

3. **Delegate checks to vendor skill**
   - For Unifi: Query device and client status
   - Get connection metrics

4. **Recommend/apply fixes**
   - Identify root cause
   - Suggest resolution steps
   - Apply fixes if authorized

## Diagnostic Checklist

### Layer 1 - Physical
- [ ] Device powered on?
- [ ] Ethernet cable connected? (for wired)
- [ ] WiFi enabled? (for wireless)
- [ ] Correct SSID? (for wireless)

### Layer 2 - Data Link
- [ ] Device appears in controller?
- [ ] MAC address visible?
- [ ] Connected to correct VLAN?
- [ ] Link speed normal?

### Layer 3 - Network
- [ ] Has IP address?
- [ ] IP in correct subnet?
- [ ] Can ping gateway?
- [ ] Can ping other LAN devices?

### Layer 4+ - Transport/Application
- [ ] DNS resolving?
- [ ] Can reach internet?
- [ ] Specific service/port accessible?

## Common Issues & Solutions

### No IP Address
```
Symptoms: Device connected but no IP
Checks:
1. DHCP server running?
2. DHCP pool exhausted?
3. Device set to DHCP?
Solutions:
- Verify DHCP server status
- Expand DHCP range
- Release/renew DHCP lease
```

### Can't Reach Internet
```
Symptoms: LAN works, no internet
Checks:
1. WAN link up?
2. DNS working?
3. Gateway routing?
Solutions:
- Check WAN connection
- Test with 8.8.8.8 (bypass DNS)
- Verify default route
```

### Slow WiFi
```
Symptoms: Connected but slow speeds
Checks:
1. Signal strength?
2. Channel congestion?
3. Client capabilities?
Solutions:
- Move closer to AP
- Change channels
- Check for interference
```

### Inter-VLAN Communication Blocked
```
Symptoms: Can't reach device on other VLAN
Checks:
1. Firewall rules?
2. Routing configured?
3. Correct VLAN assignment?
Solutions:
- Add firewall allow rule
- Verify inter-VLAN routing
```

## Diagnostic Commands

### From Affected Device
```bash
# Check IP configuration
ip addr show  # Linux
ipconfig      # Windows

# Test gateway
ping 10.0.0.1

# Test DNS
nslookup google.com

# Test internet
ping 8.8.8.8
```

### From Controller (via MCP)
```
# Get client status
unifi_get_client (MAC address)

# Get device health
unifi_list_devices

# Check connectivity metrics
unifi_get_device (device MAC)
```

## Delegation

This workflow delegates to:
- **Unifi Skill** → Device and client status queries
