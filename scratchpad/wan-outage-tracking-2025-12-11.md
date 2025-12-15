# WAN Outage Tracking - Spectrum Fiber

## Current Snapshot (2025-12-11)

### System Status
- **UCG Max Uptime:** 9.3 days (804,524 seconds)
- **WAN1 (Spectrum) Uptime:** 4.7 hours (17,098 seconds)
- **WAN2 (T-Mobile) Uptime:** 9.3 days (804,421 seconds)
- **WWW Drops Recorded:** 7

### WAN Health (24-hour window)
| Interface | Availability | Avg Latency | Status |
|-----------|--------------|-------------|--------|
| WAN1 (Spectrum) | 100% | 60ms | OK |
| WAN2 (T-Mobile) | 100% | 68ms | OK |

### Observations
1. UCG Max router stays up during WAN drops - NOT the router
2. WAN2 has been rock solid (9.3 days) - failover works
3. WAN1 resets frequently but availability shows 100% within 24h window
4. Last speedtest: 203 Mbps down, 2 Mbps up (upload seems low for fiber)

### History
- 3rd modem replacement in ~3 months
- Fiber line tested twice by technicians in last 4 months
- Technician visit: ~Dec 4-5, 2025 (Thursday)

### Suspects
1. **Physical layer** - ONT connector, fiber splice, Ethernet cable
2. **ONT power supply** - intermittent power issues
3. **ISP upstream** - signal level issues
4. **UCG Max eth4 port** - unlikely but possible (try different port)

### Recommended Tests
- [ ] Swap Ethernet cable between ONT and UCG Max
- [ ] Check ONT lights during next outage
- [ ] Try WAN1 on different UCG Max port
- [ ] Request fiber signal level check from Spectrum

---

## Weekly Log

### Week of 2025-12-09
- **Dec 11:** Captured baseline. WAN1 uptime 4.7h, 7 drops in www subsystem.
- **Dec 9:** Multiple client disconnection events logged (iPhone, Mac)

---

*Next capture scheduled: Weekly or after next outage*
