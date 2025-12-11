---
name: Network
description: Network infrastructure orchestration and management. USE WHEN user mentions network, VLAN, firewall, routing, WiFi, switches, access points, network segmentation, or managing network devices. Delegates operations to vendor-specific skills (Unifi, OpnSense).
---

# Network

Vendor-agnostic network orchestration skill that defines goals, policies, and desired state while delegating implementation to vendor-specific skills.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Network
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Inventory** | "show network devices", "what's on my network" | `workflows/Inventory.md` |
| **ClientManagement** | "list clients", "who's connected", "block device" | `workflows/ClientManagement.md` |
| **VlanSetup** | "create VLAN", "network segmentation" | `workflows/VlanSetup.md` |
| **FirewallConfig** | "firewall rules", "block traffic", "allow access" | `workflows/FirewallConfig.md` |
| **WifiManagement** | "WiFi networks", "SSID", "wireless" | `workflows/WifiManagement.md` |
| **Troubleshoot** | "network issue", "connectivity problem", "debug network" | `workflows/Troubleshoot.md` |

## Examples

**Example 1: View network inventory**
```
User: "What devices are on my network?"
→ Invokes Inventory workflow
→ Delegates to Unifi skill for device enumeration
→ Returns: List of all network devices with status, IPs, and roles
```

**Example 2: Create network segmentation**
```
User: "Set up an IoT VLAN to isolate smart home devices"
→ Invokes VlanSetup workflow
→ Gathers requirements (VLAN ID, subnet, firewall rules)
→ Delegates to Unifi skill for implementation
→ Returns: VLAN created with isolation rules
```

**Example 3: Manage connected clients**
```
User: "Show me who's connected to the network"
→ Invokes ClientManagement workflow
→ Delegates to Unifi skill for client list
→ Returns: Connected devices with names, IPs, connection type, and bandwidth
```

**Example 4: Troubleshoot connectivity**
```
User: "My device can't reach the internet"
→ Invokes Troubleshoot workflow
→ Checks device status, DHCP, DNS, gateway connectivity
→ Returns: Diagnosis and recommended fixes
```

## Architecture

```
+----------------------------------------------------------+
|                    Network Skill                          |
|  (Orchestrator - vendor-agnostic)                        |
|                                                           |
|  - Goals & Requirements (segmentation, monitoring)        |
|  - Desired State (VLANs, firewall rules, etc.)           |
|  - Processes (device inventory, alerting)                |
|  - Documentation templates                                |
|  - Delegates operations to vendor skills                  |
+----------------------------+-----------------------------+
                             |
         +-------------------+-------------------+
         v                   v                   v
   +-----------+      +------------+      +-----------+
   |   Unifi   |      |  OpnSense  |      |  Generic  |
   |   Skill   |      |   Skill    |      |   Linux   |
   |           |      |  (future)  |      |  (future) |
   |  (MCP)    |      |            |      |           |
   +-----------+      +------------+      +-----------+
```

## Key Concepts

### Network Segmentation
- **Main Network:** Trusted devices (computers, phones)
- **IoT Network:** Smart home devices (isolated)
- **Guest Network:** Visitors (internet-only, no LAN access)
- **Management Network:** Network infrastructure devices

### Security Principles
- Default deny between VLANs
- Explicit allow rules only as needed
- IoT devices should not initiate connections to main network
- Guest network has no LAN access

### Monitoring Goals
- Device inventory and health
- Bandwidth usage per client
- Connection quality metrics
- Alerts for new/unknown devices

## Integration

- **Unifi Skill:** Primary vendor implementation (UCG Max, U6-LR APs)
- **Joplin:** Documentation storage for network diagrams and policies
- **Security Skill:** Threat modeling for network architecture

## Vendor Skills

| Vendor | Status | Skill |
|--------|--------|-------|
| UniFi | Active | `Unifi` - MCP-based, 81 tools |
| OpnSense | Planned | Future firewall skill |
| Generic Linux | Planned | For non-managed devices |

## BF Infrastructure Details

Current hardware at the BF property:
- **UniFi Cloud Gateway Max** (UCG Max) - Router/Controller at 10.0.0.1
- **3x UniFi U6-LR Access Points** - WiFi coverage
- Additional network devices managed via UniFi controller
