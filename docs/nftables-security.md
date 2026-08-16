# RCS CyberTrack — Least-Privilege Privilege Boundary Architecture

This document specifies the privilege boundary and command safety guarantees implemented for **RCS CyberTrack Core**.

---

## 1. FastAPI Unprivileged Process Isolation

The FastAPI management server process runs strictly as an unprivileged system user (`cybertrack`). It is **never** executed as `root` or launched with `sudo`.

---

## 2. Least-Privilege `sudo -n` Execution Boundary

To apply kernel Netlink packet filtering rules without elevating the entire web application process, RCS CyberTrack delegates **only** the specific `/usr/sbin/nft` netlink invocation through a non-interactive `sudo -n` argv command array:

```python
# Command array execution (never shell=True)
["/usr/bin/sudo", "-n", "/usr/sbin/nft", "-f", "-"]
["/usr/bin/sudo", "-n", "/usr/sbin/nft", "-c", "-f", "-"]
["/usr/bin/sudo", "-n", "/usr/sbin/nft", "-j", "list", "ruleset"]
```

### Safety Guarantees
1. **Non-Interactive (`-n`)**: `sudo -n` fails immediately if passwordless sudo configuration is missing or misconfigured, preventing process hangs.
2. **Explicit Argv Array**: Avoids shell interpreters (`shell=True`, `sh -c`, `bash -c`). Command strings are never concatenated.
3. **Allowlisted Executable**: Only `/usr/sbin/nft` is invoked. Arbitrary executables or user-supplied command paths are rejected.
4. **Scoped Table Target**: Execution applies strictly to `table inet rcs_cybertrack`.

---

## 3. Required Appliance Sudoers Configuration

For production/staging appliances running RCS CyberTrack, deploy the following narrowly-scoped policy file at `/etc/sudoers.d/rcs-cybertrack`:

```sudoers
# /etc/sudoers.d/rcs-cybertrack
# Scope elevated privilege strictly to the allowlisted nftables binary for table inet rcs_cybertrack operations
cybertrack ALL=(root) NOPASSWD: /usr/sbin/nft -f -
cybertrack ALL=(root) NOPASSWD: /usr/sbin/nft -c -f -
cybertrack ALL=(root) NOPASSWD: /usr/sbin/nft -j list ruleset
```

Permissions: `chmod 0440 /etc/sudoers.d/rcs-cybertrack`.

---

## 4. Fail-Closed Error Handling & Production Hardening

If passwordless privilege escalation is unavailable or returns an error, the backend fails closed and returns HTTP 500:
`"Privileged nftables execution failed: sudo passwordless privilege rule for '/usr/sbin/nft' is missing or netlink access was denied"`

### Hardening Features:
1. **IPv4 & IPv6 Support**: Rules compile to `ip saddr`/`ip daddr` for IPv4 and `ip6 saddr`/`ip6 daddr` for IPv6 based on validated IP family. Mixed IPv4/IPv6 rules are rejected.
2. **Command Injection & Metacharacter Rejection**: All fields (addresses, ports, interfaces, rule IDs) reject newlines, null bytes, semicolons, shell metacharacters (`;&|$` ` `), and command words (`exec`, `eval`, `system`, `bash`, `sh`, `sudo`).
3. **Configuration-Driven Management Ports**: Management ports default to `8000` (API) and `22` (SSH) for backward compatibility, and can be customized cleanly via `PolicyConfig` (`api_port`, `ssh_port`).
