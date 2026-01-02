# VlanSetup Workflow

**Purpose:** Create and configure VLANs for network segmentation.

## Execution Steps

1. **Gather requirements**
   - VLAN purpose (IoT, Guest, Management, etc.)
   - VLAN ID (1-4094)
   - Subnet (e.g., 10.0.10.0/24)
   - DHCP settings
   - Inter-VLAN routing rules

2. **Plan configuration**
   - Define network settings
   - Plan firewall rules
   - Identify which ports/SSIDs should use this VLAN

3. **Delegate to vendor skill**
   - For Unifi: Create network via MCP tools
   - Configure DHCP server
   - Set up firewall rules

4. **Verify and document**
   - Test VLAN connectivity
   - Verify isolation rules
   - Document in Joplin

## Common VLAN Configurations

### IoT Network
```
VLAN ID: 20
Subnet: 10.0.20.0/24
Purpose: Smart home devices
Rules:
- Can reach internet
- Cannot initiate to main network
- Main network can initiate to IoT
```

### Guest Network
```
VLAN ID: 30
Subnet: 10.0.30.0/24
Purpose: Visitor internet access
Rules:
- Internet only
- No LAN access whatsoever
- Client isolation enabled
```

### Management Network
```
VLAN ID: 99
Subnet: 10.0.99.0/24
Purpose: Network infrastructure
Rules:
- Highly restricted access
- Only admin devices can reach
```

## Firewall Rule Templates

### Isolate VLAN (default deny)
```
Rule: Block VLAN_X to all RFC1918
Action: Drop
From: VLAN_X network
To: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
```

### Allow established/related
```
Rule: Allow established back to VLAN_X
Action: Accept
State: Established, Related
To: VLAN_X network
```

## Delegation

This workflow delegates to:
- **Unifi Skill** → Network and firewall configuration
