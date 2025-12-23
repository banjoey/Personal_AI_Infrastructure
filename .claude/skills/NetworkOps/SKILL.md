---
name: NetworkOps
description: Network operations and management for home infrastructure. USE WHEN configuring VLANs, managing firewall rules, troubleshooting connectivity, configuring DNS, OR managing UniFi/OpnSense devices. Covers routing, switching, wireless, and network security.
---

# NetworkOps

Network operations skill for managing home network infrastructure including UniFi and OpnSense devices.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName NetworkOps
```

| Workflow | Trigger | File |
|----------|---------|------|
| **ConfigureVlan** | "create VLAN", "configure VLAN", "network segmentation" | `workflows/ConfigureVlan.md` |
| **ConfigureFirewall** | "firewall rule", "allow traffic", "block traffic" | `workflows/ConfigureFirewall.md` |
| **TroubleshootConnectivity** | "can't connect", "network unreachable", "no internet" | `workflows/TroubleshootConnectivity.md` |
| **ConfigureDns** | "DNS record", "configure DNS", "hostname resolution" | `workflows/ConfigureDns.md` |
| **ManageWireless** | "WiFi network", "SSID", "wireless config" | `workflows/ManageWireless.md` |
| **AuditNetwork** | "network audit", "security review", "what's on my network" | `workflows/AuditNetwork.md` |
| **ConfigurePortForward** | "port forward", "expose service", "NAT rule" | `workflows/ConfigurePortForward.md` |

## Examples

**Example 1: Troubleshoot connectivity**
```
User: "The gitlab-mcp pod can't reach the UniFi controller"
→ Invokes TroubleshootConnectivity workflow
→ Identifies source (10.0.20.x) and dest (10.0.0.1) VLANs
→ Checks firewall rules between VLANs
→ Tests connectivity with ping/curl
→ Identifies and fixes blocking rule
```

**Example 2: Create new VLAN**
```
User: "Create a VLAN for IoT devices"
→ Invokes ConfigureVlan workflow
→ Determines VLAN ID and subnet
→ Creates VLAN in UniFi
→ Configures DHCP scope
→ Sets up firewall rules (isolate from main network)
→ Documents in Joplin
```

**Example 3: Network security audit**
```
User: "What devices are on my network?"
→ Invokes AuditNetwork workflow
→ Scans for active devices
→ Identifies unknown devices
→ Reports on network segmentation status
→ Recommends security improvements
```

## Network Topology

### VLANs (Current)

| VLAN ID | Name | Subnet | Purpose |
|---------|------|--------|---------|
| 1 | bf-core | 10.0.0.0/24 | Core infrastructure (router, controller) |
| 10 | bf-home | 10.0.10.0/24 | Home devices, personal |
| 20 | bf-servers | 10.0.20.0/24 | Servers (ai1, ai2, nas1, k3s) |
| 30 | bf-iot | 10.0.30.0/24 | IoT devices (isolated) |
| 40 | bf-guest | 10.0.40.0/24 | Guest network |

### Key Devices

| Device | IP | VLAN | Role |
|--------|-----|------|------|
| UCG-Ultra | 10.0.0.1 | bf-core | Router, UniFi Controller |
| ai1 | 10.0.20.15 | bf-servers | k3s worker node |
| ai2 | 10.0.20.22 | bf-servers | k3s control plane |
| nas1 | 10.0.20.10 | bf-servers | Unraid NAS |

## Troubleshooting Decision Tree

### Can't Reach Destination
```
Source → Destination connectivity issue?
├── Same VLAN?
│   ├── Yes → Check:
│   │   ├── IP correct?
│   │   ├── Service running?
│   │   └── Host firewall?
│   └── No → Check:
│       ├── Inter-VLAN routing enabled?
│       ├── Firewall rules allow traffic?
│       └── Correct gateway configured?
├── Ping works but service doesn't?
│   ├── Check port open: nc -zv {ip} {port}
│   ├── Check service listening: ss -tlnp
│   └── Check application logs
└── DNS resolution failing?
    ├── Check DNS server configured
    ├── Check DNS server reachable
    └── Check record exists
```

## Firewall Rule Principles

### Default Policies
- **Inter-VLAN**: Deny by default
- **Internet outbound**: Allow (most VLANs)
- **Internet inbound**: Deny (except explicit forwards)

### Rule Order Matters
1. Established/related traffic (allow)
2. Specific allow rules
3. Specific deny rules
4. Default deny

### Common Rules Needed

| From | To | Ports | Purpose |
|------|-----|-------|---------|
| bf-servers | bf-core | 443, 8443 | UniFi controller access |
| bf-servers | Internet | 443, 80 | Outbound HTTPS/HTTP |
| bf-home | bf-servers | 22, 443 | SSH and web access |
| bf-iot | Internet | 443, 123 | Updates, NTP only |

## MCP Dependencies

- **unifi-mcp** - UniFi controller management
- **opnsense-mcp** (future) - Firewall management if using OpnSense

## DNS Management

### Internal DNS (UniFi/Router)
- Use for internal hostnames
- `.local` or `.home` domain
- Auto-registered via DHCP

### External DNS (Cloudflare)
- `*.op.barkleyfarm.com` - Internal services via Traefik
- Managed via cloudflare-mcp

## Related Skills

- **Platform** - For k8s networking (Services, Ingress)
- **Security** - For network security policies
- **SRE** - For network monitoring and alerting

## Security Best Practices

1. **Segment IoT** - Never on same VLAN as servers/personal
2. **Deny by default** - Explicit allow rules only
3. **Log denied traffic** - For security monitoring
4. **Regular audits** - Quarterly review of devices and rules
5. **No UPnP** - Manual port forwards only
