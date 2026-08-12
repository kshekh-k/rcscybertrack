# RCS CyberTrack — Real nftables Firewall Backend Architecture

This document describes the Phase 5.3 defence-grade **nftables firewall backend** implemented for RCS CyberTrack Core.

---

## 1. Resource Ownership Model

RCS CyberTrack manages **only** resources created inside its isolated table:
- **Table Name**: `table inet rcs_cybertrack`
- **Managed Chains**: `input`, `output`, `forward`

The backend:
- Never executes `flush ruleset` on the host.
- Never flushes or modifies unrelated tables (e.g., Docker, UFW, iptables-legacy).
- Performs read-only discovery (`nft -j list ruleset`) to verify ownership before applying.

---

## 2. Management Access Protection

To prevent accidental operator lockout, the deterministic rule compiler automatically prepends essential management access rules to `chain input`:
```nftables
iifname "lo" accept comment "rcscybertrack:mgmt-loopback"
ct state { established, related } accept comment "rcscybertrack:mgmt-state"
tcp dport 8000 accept comment "rcscybertrack:mgmt-api"
tcp dport 22 accept comment "rcscybertrack:mgmt-ssh"
```

---

## 3. Atomic Transactions & Rollback

1. **Atomic Compilation**: Rules are compiled deterministically into a single complete `table inet rcs_cybertrack` configuration string.
2. **Pre-Apply Syntax Check**: Tested using `nft -c -f -` (timeout 5s).
3. **Atomic Apply**: Applied via `nft -f -` in a single transaction.
4. **Post-Apply Verification**: Verifies table presence and rule count.
5. **Automatic Rollback**: If apply or verification fails, the previous ruleset snapshot is restored atomically.
