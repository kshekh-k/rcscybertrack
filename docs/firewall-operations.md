# RCS CyberTrack — Firewall Operations Guide

This guide details administration and operations for the RCS CyberTrack nftables firewall backend.

---

## 1. REST API Operations Summary

- `GET /api/v1/firewall/rules` — List configured firewall rules (`firewall.read`).
- `POST /api/v1/firewall/rules` — Add firewall rule (`firewall.write`).
- `PUT /api/v1/firewall/rules/{id}` — Update firewall rule (`firewall.write`).
- `DELETE /api/v1/firewall/rules/{id}` — Delete firewall rule (`firewall.write`).
- `GET /api/v1/firewall/status` — Read-only backend capability discovery (`firewall.read`).
- `GET /api/v1/firewall/diff` — View compiled ruleset diff for `table inet rcs_cybertrack` (`firewall.read`).
- `POST /api/v1/firewall/validate` — Perform syntax and schema validation (`firewall.write`).
- `POST /api/v1/firewall/apply` — Apply compiled ruleset atomically (`firewall.write`).

---

## 2. Troubleshooting & Discovery

If `GET /api/v1/firewall/status` indicates `available: false`:
1. Check if `nftables` is installed: `which nft` or `apt-get install nftables`.
2. Verify binary permissions on `/usr/sbin/nft`.
3. Check audit logs (`GET /api/v1/audit`) for `FIREWALL_APPLY_FAILED` or verification events.
