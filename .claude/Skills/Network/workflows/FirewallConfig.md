# FirewallConfig Workflow

**Purpose:** Manage firewall rules for traffic control between networks.

## Execution Steps

1. **Understand the requirement**
   - What traffic to allow/block?
   - Source network/device
   - Destination network/service
   - Direction (inbound, outbound, inter-VLAN)

2. **Design the rule**
   - Rule name (descriptive)
   - Action (accept, drop, reject)
   - Protocol (TCP, UDP, ICMP, any)
   - Ports (if applicable)
   - Source/destination specifications

3. **Delegate to vendor skill**
   - For Unifi: Use firewall rule MCP tools
   - Apply to appropriate ruleset

4. **Verify and test**
   - Confirm rule is active
   - Test connectivity matches expectations

## Rule Types

### Traffic Rules (UniFi)
Modern UniFi uses "Traffic Rules" for most scenarios:
- App-based blocking (social media, gaming, etc.)
- Device-specific rules
- Schedule-based rules

### Firewall Rules (Traditional)
For advanced inter-VLAN and WAN rules:
- LAN In: Traffic entering from LAN to router
- LAN Out: Traffic from router to LAN
- WAN In: Inbound from internet
- WAN Out: Outbound to internet

## Common Scenarios

### Block IoT from Main Network
```
Name: Block IoT to Main
Action: Drop
Source: IoT Network (VLAN 20)
Destination: Main Network (VLAN 1)
Protocol: All
```

### Allow Specific IoT Device to Main
```
Name: Allow Smart Speaker to Media Server
Action: Accept
Source: 10.0.20.50 (Smart Speaker)
Destination: 10.0.0.100:8096 (Jellyfin)
Protocol: TCP
```

### Block Guest from LAN
```
Name: Guest Isolation
Action: Drop
Source: Guest Network
Destination: RFC1918 (all private IPs)
Protocol: All
```

## Best Practices

1. **Default deny between VLANs** - Start with everything blocked
2. **Explicit allows only** - Add rules for specific needed traffic
3. **Document every rule** - Why does this rule exist?
4. **Review regularly** - Remove unused rules

## Delegation

This workflow delegates to:
- **Unifi Skill** → Firewall rule management via MCP
