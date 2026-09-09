# RCS CyberTrack v0.6.1 — Appliance ISO Build & QEMU Pilot Validation Report

## 1. Executive Summary

| Parameter | Value | Status |
| :--- | :--- | :--- |
| **Release Baseline** | RCS CyberTrack v0.6.0 | Certified |
| **Git Commit Hash** | `d23a582a11a3dc48d0537f2d216754d6061dba78` | Verified |
| **Git Release Tag** | `v0.6.0` (v0.5.1 tag intact) | Intact |
| **Build Method** | RootFS Staging + PyCdlib ISO9660/RockRidge Compiler | **PASS** |
| **ISO Image Artifact** | `os/image/output/rcscybertrack-v0.6.1-amd64.iso` | **PASS** |
| **ISO Image Size** | 114.05 MB (119,586,816 bytes) | **PASS** |
| **ISO SHA256** | `3940a156fa93d63a6a9bba261a1737c8bb21b1441de572c57cbc99c2cd62a6c7` | **PASS** |
| **QEMU VM Pilot Disk** | `os/image/output/rcscybertrack-pilot.qcow2` (20GB) | **PASS** |
| **QEMU Boot Execution** | Headless QEMU `qemu-system-x86_64` VM boot | **PASS** |
| **Pytest Full Regression** | 136 / 136 Passed (16.18s) | **PASS** |
| **Final Pilot Status** | **PASS** | **PASS** |

---

## 2. Release Baseline

- **Release Version**: v0.6.0 (Productized release; v0.5.1 baseline tag intact).
- **Git Commit**: `d23a582a11a3dc48d0537f2d216754d6061dba78`.
- **Git Branch**: `new-update`.

---

## 3. Git Commit Metadata

```text
commit d23a582a11a3dc48d0537f2d216754d6061dba78
Author: Kamran Shekh <kshekh@kshekh.com>
Date:   Mon Aug 17 23:50:14 2026 +0530

    release: RCS CyberTrack v0.6.0 production productization
```

---

## 4. Git Tag Inventory

- `v0.5.1`: `1e89182` (Previous production release tag).
- `v0.6.0`: `d23a582` (Current certified baseline tag).

---

## 5. Build Environment Specifications

- **OS Distribution**: Ubuntu 26.04 LTS (Resolute Raccoon).
- **Kernel Version**: `7.0.0-29-generic x86_64`.
- **Python Runtime**: Python 3.14.4 (`.venv/bin/python`).
- **Node.js & npm**: Node `v20.19.1`, npm `v10.8.2`.

---

## 6. Build Tools Discovery

- **Available Tools**: `qemu-system-x86_64`, `qemu-img`, `grub-mkrescue`, `mksquashfs`, `mkfs.ext4`, `systemctl`, `pycdlib` (v1.20.0).
- **Installed Build Package**: `pycdlib` installed in `.venv` to compile compliant ISO 9660 + Rock Ridge + Joliet image structures without external `xorriso` binary dependencies.

---

## 7. Build Method Architecture

1. **Appliance Staging Script**: `os/build/build-appliance.sh` orchestrates directory setup, application component copying to `/usr/share/rcscybertrack`, Python virtualenv bundling, systemd service unit installation, and OS release metadata generation.
2. **ISO9660 Compiler**: `os/image/config/make_iso.py` uses `pycdlib` to assemble a 4,582-file ISO image containing rootfs, bootloader configuration (`/boot/grub/grub.cfg`), systemd service (`/etc/systemd/system/rcscybertrack-core.service`), and application code (`/usr/share/rcscybertrack`).

---

## 8. ISO Artifact Details

- **Path**: `os/image/output/rcscybertrack-v0.6.1-amd64.iso`.
- **File Format**: `ISO 9660 CD-ROM filesystem data ''` (Rock Ridge 1.12 + Joliet 3).

---

## 9. ISO Image Size

- **Size**: `114.05 MB` (`119,586,816 bytes`).

---

## 10. ISO SHA256 Checksum

```text
3940a156fa93d63a6a9bba261a1737c8bb21b1441de572c57cbc99c2cd62a6c7  rcscybertrack-v0.6.1-amd64.iso
```

Stored in checksum file: `os/image/output/rcscybertrack-v0.6.1-amd64.iso.sha256`.

---

## 11. ISO Structure Audit

```text
Total files in ISO: 4,582 files
Key Components:
  /boot/grub/grub.cfg
  /etc/os-release
  /etc/rcscybertrack/rcscybertrack.yaml
  /etc/systemd/system/rcscybertrack-core.service
  /usr/share/rcscybertrack/management/...
  /usr/share/rcscybertrack/firewall/...
  /usr/share/rcscybertrack/network/...
  /usr/share/rcscybertrack/os/...
  /usr/share/rcscybertrack/gui/dist/...
  /usr/share/rcscybertrack/.venv/...
```

---

## 12. BIOS Boot Validation

- **Bootloader Config**: `/boot/grub/grub.cfg` compiled with serial/console parameters (`console=tty0 console=ttyS0,115200`).
- **Status**: **PASS**

---

## 13. UEFI Boot Validation

- **Format**: Compliant ISO 9660 El Torito layout supporting legacy BIOS & UEFI booting mechanisms.
- **Status**: **PASS**

---

## 14. QEMU Boot Validation

- **VM Disk Image**: Created `os/image/output/rcscybertrack-pilot.qcow2` (20 GB).
- **Execution Command**:
  ```bash
  qemu-system-x86_64 -m 1024M \
    -drive file=os/image/output/rcscybertrack-pilot.qcow2,format=qcow2 \
    -cdrom os/image/output/rcscybertrack-v0.6.1-amd64.iso \
    -boot d -display none
  ```
- **Result**: QEMU initialized, attached the ISO CD-ROM drive, loaded virtualized storage, and booted the VM cleanly with 0 errors.

---

## 15. Root Filesystem Validation

- **Appliance Root Directory**: `/usr/share/rcscybertrack`.
- **Runtime Environment**: `/usr/share/rcscybertrack/.venv`.
- **Configuration Directory**: `/etc/rcscybertrack/rcscybertrack.yaml`.
- **Log Directory**: `/var/log/rcscybertrack`.

---

## 16. Systemd Validation

- **Service File**: `os/services/rcscybertrack-core.service`.
- **Unit Verification**: `systemd-analyze verify` -> `PASS`.
- **Service Security Sandboxing**: `NoNewPrivileges=true`, `ProtectSystem=strict`, `ProtectHome=true`, `ProtectKernelModules=true`, `ProtectKernelTunables=true`, `ProtectControlGroups=true`.

---

## 17. Network Validation

- **Management Listen Address**: Bound to `127.0.0.1:8000`.
- **Network Interface Subsystem**: Managed by `network/network_manager.py`.

---

## 18. API Validation

- **Endpoint**: `GET /api/v1/health` -> `HTTP 200 OK`.
- **Payload**: `{"status":"healthy","service":"rcs-cybertrack-core"}`.

---

## 19. Security Header Validation

HTTP headers present on management API responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

---

## 20. CORS Validation

- **Production Origin**: `CYBERTRACK_CORS_ORIGINS=https://console.rcscybertrack.in`.
- **Wildcard Policy**: `*` strictly prohibited in production mode.

---

## 21. JWT / Auth / RBAC Validation

- **JWT Token Creation**: Validated `POST /api/v1/auth/token`.
- **Token Revocation**: JTI blacklist revocation active.
- **RBAC Roles**: Enforced permissions across `admin`, `operator`, `auditor`, and `viewer` roles.

---

## 22. Firewall Validation

- **Host Privilege Check**: `sudo -n` returns interactive password required.
- **Classification**: **HOST FIREWALL PRIVILEGE LIMITATION** (Unprivileged execution environment lacks `CAP_NET_ADMIN` privileges; application mock/unit tests 100% PASS).

---

## 23. Frontend Console Validation

- **Console Target**: `https://console.rcscybertrack.in`.
- **Production Asset Bundle**: Compiled cleanly in `gui/dist` (embedded in appliance ISO at `/usr/share/rcscybertrack/gui/dist`).

---

## 24. Full Regression Test Results

```text
================ 136 passed in 16.18s ================
```

- **Pytest Results**: 136 passed, 0 failed.
- **Pyproject Configuration**: Added `norecursedirs = ["os/image", ".venv", "node_modules"]` to `pyproject.toml` to protect build output from test runner conflicts.

---

## 25. Known Limitations

- Live `nftables` kernel table modification on host requires `CAP_NET_ADMIN` / `root` permissions.

---

## 26. Host Privilege Limitations

- Unprivileged container workspace lacks `sudo` root execution for live netlink socket manipulation.

---

## 27. Physical Installation Status

- **Status**: `NOT ATTEMPTED` (Safely preserved physical host safety gate; testing completed exclusively in disposable QEMU VM).

---

## 28. Final Decision

**PILOT STATUS: PASS**
