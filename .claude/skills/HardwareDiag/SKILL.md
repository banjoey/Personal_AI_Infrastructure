---
name: HardwareDiag
description: Hardware diagnostics and health monitoring. USE WHEN user mentions hardware check, diagnose, SMART status, disk health, why did server crash, system health, temperature, OR troubleshooting hardware issues. Proactively offers comprehensive scans.
---

# HardwareDiag - Hardware Diagnostics Skill

**Proactive hardware health monitoring and troubleshooting for all systems.**

## Workflow Routing

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Quick Scan** | "check hardware on X", "is X healthy?" | Run fast diagnostics, offer comprehensive |
| **Comprehensive Scan** | "full hardware check", "diagnose X thoroughly" | Complete diagnostic suite |
| **Crash Investigation** | "why did X crash?", "X went offline" | Focus on logs, last shutdown, errors |
| **SMART Check** | "check disks on X", "SMART status" | Disk-focused diagnostics |
| **Compare Baseline** | "compare X to baseline", "trending" | Historical comparison |

## Quick Reference

```bash
# The skill will SSH to targets automatically
# Default user: joey (root for Unraid)
# Uses existing SSH keys from ~/.ssh/

# Results stored in Joplin: Tech/Hardware Diagnostics/{hostname}/
```

## Connection Logic

1. **Parse target**: hostname, IP, or SSH config name
2. **Detect OS**: Ubuntu, Unraid, Debian, etc.
3. **Select user**: `joey` default, `root` for Unraid
4. **Run diagnostics**: Adapt commands to OS
5. **Store results**: Joplin notebook for historical tracking

## Diagnostic Categories

### Quick Scan (30-60 seconds)
- System uptime and last boot reason
- Disk SMART status (quick)
- Memory usage and errors
- CPU temperature and load
- Recent critical log entries
- Network interface status

### Comprehensive Scan (2-5 minutes)
Everything in Quick Scan plus:
- Full SMART attributes for all disks
- Detailed dmesg analysis
- Journal errors (last 24h)
- I/O statistics
- Memory ECC errors (if available)
- Power supply/UPS status
- Temperature history
- Kernel panic/oops detection
- Failed services
- Filesystem health

### Crash Investigation
- Last shutdown reason
- Journal from previous boot (`journalctl -b -1`)
- Kernel panic traces
- OOM killer events
- Hardware error logs (mcelog)
- Power events
- Thermal shutdown indicators

## Severity Levels

| Level | Indicator | Meaning |
|-------|-----------|---------|
| OK | Green | Normal operation |
| WARNING | Yellow | Attention needed, not urgent |
| CRITICAL | Red | Immediate action required |

### Thresholds (Auto-Applied)

| Metric | WARNING | CRITICAL |
|--------|---------|----------|
| CPU Temp | > 70°C | > 85°C |
| Disk Usage | > 80% | > 95% |
| SMART Reallocated Sectors | > 0 | > 100 |
| SMART Pending Sectors | > 0 | > 10 |
| Memory Usage | > 85% | > 95% |
| Load Average (per core) | > 2.0 | > 5.0 |
| Disk Read Errors | > 0 | > 10 |

## Storage Integration

**Results stored in Joplin:**
```
Tech Documentation/
└── Hardware Diagnostics/
    └── {hostname}/
        ├── baseline-{date}.md      # Initial enrollment
        ├── scan-{date}.md          # Regular scans
        └── incident-{date}.md      # Crash investigations
```

**Comparison enabled:** Each scan can compare against baseline or previous scan.

## OS-Specific Adaptations

### Ubuntu/Debian
- Uses `smartctl`, `sensors`, `journalctl`
- Checks systemd service status
- ECC memory via `edac-util` if available

### Unraid
- Uses `root@` for SSH
- Checks array status
- Parity check status
- Docker container health
- VM status

### Generic Linux
- Falls back to basic tools
- `/proc` and `/sys` parsing
- dmesg analysis

## Proactive Behavior

When user mentions hardware concerns, the skill will:

1. **Immediately run Quick Scan** - Don't wait for explicit request
2. **Highlight anomalies** - Anything outside normal parameters
3. **Offer next steps** - "Want me to run a comprehensive scan?" or "Should I investigate the disk errors?"
4. **Compare to history** - If baseline exists, show deltas

## Example Interactions

**User:** "Can you check the hardware on ai2?"
**Response:** Runs Quick Scan, reports findings, offers comprehensive if issues found.

**User:** "ai2 went offline, why?"
**Response:** Runs Crash Investigation workflow, analyzes previous boot logs.

**User:** "Full hardware check on nas1"
**Response:** Runs Comprehensive Scan with Unraid-specific checks.

## Credential Handling

1. **SSH Keys**: Uses `~/.ssh/` keys (existing config)
2. **sudo**: Uses passwordless sudo where configured
3. **Passwords**: If needed, stores in macOS Keychain:
   ```bash
   security add-generic-password -a "pai-hardware" -s "{hostname}" -w "{password}"
   security find-generic-password -a "pai-hardware" -s "{hostname}" -w
   ```
4. **Infisical**: Fallback for secrets if k8s cluster is available

## Files

- `workflows/QuickScan.md` - Fast diagnostic workflow
- `workflows/ComprehensiveScan.md` - Full diagnostic workflow
- `workflows/CrashInvestigation.md` - Post-crash analysis
- `scripts/remote-diag.sh` - Diagnostic script to run on targets
