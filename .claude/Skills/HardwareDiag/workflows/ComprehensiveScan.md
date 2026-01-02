# ComprehensiveScan Workflow

**Full hardware diagnostic suite (2-5 minutes)**

## Trigger
- "full hardware check on {target}"
- "comprehensive scan {target}"
- "deep diagnostics {target}"
- After Quick Scan finds issues

## Steps

### 1. Connection & OS Detection
(Same as QuickScan)

### 2. System Information

```bash
echo "=== COMPREHENSIVE HARDWARE SCAN: $(hostname) ==="
echo "Timestamp: $(date -Iseconds)"
echo ""

# Detailed system info
echo "=== SYSTEM INFORMATION ==="
echo "Hostname: $(hostname -f 2>/dev/null || hostname)"
echo "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo "Boot time: $(who -b 2>/dev/null)"
echo "Last reboot: $(last reboot | head -1)"
echo ""

# Hardware info
echo "=== HARDWARE INFO ==="
if command -v dmidecode &>/dev/null; then
    echo "System:"
    sudo dmidecode -t system 2>/dev/null | grep -E "Manufacturer|Product|Serial|UUID" | head -5
    echo ""
    echo "BIOS:"
    sudo dmidecode -t bios 2>/dev/null | grep -E "Vendor|Version|Release" | head -3
fi
echo ""
```

### 3. CPU Diagnostics

```bash
echo "=== CPU DIAGNOSTICS ==="
echo "Model: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
echo "Cores: $(nproc) ($(grep -c processor /proc/cpuinfo) threads)"
echo "Architecture: $(lscpu | grep Architecture | awk '{print $2}')"
echo ""

echo "Load Average:"
cat /proc/loadavg
echo "Per-core load: $(echo "scale=2; $(cat /proc/loadavg | awk '{print $1}') / $(nproc)" | bc)"
echo ""

echo "CPU Frequency:"
if [ -d /sys/devices/system/cpu/cpu0/cpufreq ]; then
    echo "  Current: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null | awk '{print $1/1000}') MHz"
    echo "  Min: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_min_freq 2>/dev/null | awk '{print $1/1000}') MHz"
    echo "  Max: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq 2>/dev/null | awk '{print $1/1000}') MHz"
    echo "  Governor: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null)"
fi
echo ""

echo "CPU Temperature:"
if command -v sensors &>/dev/null; then
    sensors 2>/dev/null | grep -E "Core|Package|temp" | head -10
elif [ -d /sys/class/thermal ]; then
    for zone in /sys/class/thermal/thermal_zone*/temp; do
        name=$(cat $(dirname $zone)/type 2>/dev/null)
        temp=$(($(cat $zone 2>/dev/null) / 1000))
        echo "  $name: ${temp}°C"
    done
fi
echo ""

# Check for throttling
echo "Throttling Status:"
if [ -f /sys/devices/system/cpu/cpu0/thermal_throttle/core_throttle_count ]; then
    echo "  Throttle count: $(cat /sys/devices/system/cpu/cpu0/thermal_throttle/core_throttle_count)"
fi
```

### 4. Memory Diagnostics

```bash
echo "=== MEMORY DIAGNOSTICS ==="
free -h
echo ""

echo "Memory Details:"
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Buffers|Cached|SwapTotal|SwapFree|Dirty|Writeback"
echo ""

echo "Memory Hardware:"
if command -v dmidecode &>/dev/null; then
    sudo dmidecode -t memory 2>/dev/null | grep -E "Size:|Type:|Speed:|Manufacturer:" | head -20
fi
echo ""

echo "ECC Status:"
if [ -d /sys/devices/system/edac/mc ]; then
    echo "  ECC enabled"
    for mc in /sys/devices/system/edac/mc/mc*; do
        ce=$(cat $mc/ce_count 2>/dev/null || echo 0)
        ue=$(cat $mc/ue_count 2>/dev/null || echo 0)
        echo "  $(basename $mc): CE=$ce UE=$ue"
    done
else
    echo "  ECC not detected or not enabled"
fi
echo ""

echo "Memory Errors (dmesg):"
dmesg | grep -i "memory\|ecc\|mce\|edac" | tail -10
```

### 5. Storage Diagnostics

```bash
echo "=== STORAGE DIAGNOSTICS ==="

echo "Block Devices:"
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL
echo ""

echo "Disk Usage:"
df -h | grep -E "^/dev|^Filesystem"
echo ""

echo "SMART Status (Detailed):"
if command -v smartctl &>/dev/null; then
    for disk in $(lsblk -d -o NAME,TYPE | grep disk | awk '{print $1}'); do
        echo ""
        echo "--- /dev/$disk ---"
        sudo smartctl -i /dev/$disk 2>/dev/null | grep -E "Model|Serial|Capacity|Rotation"
        echo ""
        echo "Health:"
        sudo smartctl -H /dev/$disk 2>/dev/null | grep -i "result\|status"
        echo ""
        echo "Key Attributes:"
        sudo smartctl -A /dev/$disk 2>/dev/null | grep -E "Reallocated|Pending|Uncorrect|Power_On|Temperature|Error" | head -15
        echo ""
        echo "Error Log:"
        sudo smartctl -l error /dev/$disk 2>/dev/null | tail -10
    done
else
    echo "smartctl not installed - install smartmontools"
fi
echo ""

echo "I/O Statistics:"
if command -v iostat &>/dev/null; then
    iostat -x 1 2 | tail -20
fi
echo ""

echo "Disk Errors (dmesg):"
dmesg | grep -i "ata\|scsi\|i/o error\|sector\|bad" | tail -15
```

### 6. Network Diagnostics

```bash
echo "=== NETWORK DIAGNOSTICS ==="

echo "Interfaces:"
ip -br link show
echo ""

echo "IP Addresses:"
ip -br addr show
echo ""

echo "Interface Statistics:"
for iface in $(ip -br link show | awk '{print $1}' | grep -v lo); do
    echo "--- $iface ---"
    cat /sys/class/net/$iface/statistics/rx_errors 2>/dev/null && echo "  RX errors: $(cat /sys/class/net/$iface/statistics/rx_errors)"
    cat /sys/class/net/$iface/statistics/tx_errors 2>/dev/null && echo "  TX errors: $(cat /sys/class/net/$iface/statistics/tx_errors)"
    cat /sys/class/net/$iface/statistics/rx_dropped 2>/dev/null && echo "  RX dropped: $(cat /sys/class/net/$iface/statistics/rx_dropped)"
    cat /sys/class/net/$iface/statistics/tx_dropped 2>/dev/null && echo "  TX dropped: $(cat /sys/class/net/$iface/statistics/tx_dropped)"
    ethtool $iface 2>/dev/null | grep -E "Speed|Duplex|Link"
done
echo ""

echo "Network Errors (dmesg):"
dmesg | grep -i "eth\|nic\|network\|link" | tail -10
```

### 7. Power & Thermal

```bash
echo "=== POWER & THERMAL ==="

echo "Power Management:"
cat /sys/power/state 2>/dev/null
systemctl status sleep.target suspend.target hibernate.target 2>/dev/null | grep -E "Loaded|Active"
echo ""

echo "All Temperatures:"
if command -v sensors &>/dev/null; then
    sensors 2>/dev/null
fi
echo ""

echo "Fan Speeds:"
if command -v sensors &>/dev/null; then
    sensors 2>/dev/null | grep -i fan
fi
echo ""

echo "Power Events (last 24h):"
journalctl --since "24 hours ago" --no-pager 2>/dev/null | grep -i "power\|acpi\|suspend\|hibernate\|sleep\|wake" | tail -20
```

### 8. System Logs Analysis

```bash
echo "=== SYSTEM LOGS ANALYSIS ==="

echo "Critical/Error Messages (last 24h):"
journalctl --since "24 hours ago" -p err --no-pager 2>/dev/null | tail -30
echo ""

echo "Kernel Messages:"
dmesg | grep -iE "error|fail|warn|critical|fault" | tail -20
echo ""

echo "Failed Services:"
systemctl --failed --no-pager 2>/dev/null
echo ""

echo "Recent Service Restarts:"
journalctl --since "24 hours ago" --no-pager 2>/dev/null | grep -i "started\|stopped\|restarting" | tail -20
```

### 9. Process & Resource Usage

```bash
echo "=== PROCESS ANALYSIS ==="

echo "Top CPU Consumers:"
ps aux --sort=-%cpu | head -10
echo ""

echo "Top Memory Consumers:"
ps aux --sort=-%mem | head -10
echo ""

echo "Zombie Processes:"
ps aux | awk '$8 ~ /Z/ {print}'
```

### 10. Unraid-Specific (if detected)

```bash
if [ -f /etc/unraid-version ]; then
    echo "=== UNRAID SPECIFIC ==="

    echo "Version: $(cat /etc/unraid-version)"
    echo ""

    echo "Array Status:"
    cat /proc/mdstat 2>/dev/null | head -20
    echo ""

    echo "Parity Check:"
    cat /proc/mdstat 2>/dev/null | grep -A2 "resync\|check"
    echo ""

    echo "Docker Containers:"
    docker ps -a 2>/dev/null | head -15
    echo ""

    echo "VMs:"
    virsh list --all 2>/dev/null | head -10
fi
```

## Output Format

Same as QuickScan but with full details in each section.

## Storage

Save to Joplin:
```
Tech Documentation/Hardware Diagnostics/{hostname}/scan-{date}-comprehensive.md
```

Mark as baseline if first scan:
```
Tech Documentation/Hardware Diagnostics/{hostname}/baseline-{date}.md
```
