# RCS CyberTrack — WireGuard VPN Subsystem Architecture

This directory is reserved for the WireGuard VPN integration. This document details the planned configuration structure, peer mapping, key management, and security architecture.

## Status: Planned

## Architecture Overview

RCS CyberTrack leverages **WireGuard** as its primary Virtual Private Network (VPN) technology. WireGuard is a modern, fast, and secure VPN protocol that runs in Linux kernel-space for high throughput and low latency.

```text
  [ Remote Peer ] <==== Encrypted WireGuard Tunnel (UDP) ====> [ RCS CyberTrack ]
  10.8.0.2/32                                                 10.8.0.1/24 (wg0)
                                                                     │
                                                                     ▼
                                                             [ Local Network ]
                                                             192.168.1.0/24
```

## Tunnel Configuration (`vpn.yaml` blueprint)

VPN interface configurations will be loaded dynamically using a structured configuration model.

```yaml
vpn:
  interfaces:
    - name: wg0
      enabled: true
      ip_address: 10.8.0.1
      prefix: 24
      listen_port: 51820
      private_key_path: "/etc/rcscybertrack/vpn/wg0.key"
      dns:
        - 10.8.0.1
      peers:
        - name: branch-office-1
          public_key: "pubkey-from-branch-office-1-goes-here="
          allowed_ips:
            - 10.8.0.2/32
            - 192.168.10.0/24
          endpoint: "203.0.113.5:51820"
          persistent_keepalive: 25
```

## Key Management

To maintain a secure posture:
1. **No Plaintext Private Keys in YAML**: The `vpn.yaml` config specifies paths to keyfiles rather than storing keys directly in the config.
2. **File Permissions**: Key files must be owned by the core service user and restricted using `chmod 600`.
3. **Automated Key Generation**: The management API will call `wg genkey` and `wg pubkey` securely to initialize interfaces.

## Routing and Security Considerations

1. **Kernel Routing**: WireGuard handles route injection via `wg-quick` or `systemd-networkd`. For custom setups, the routing engine will inject routes using `ip route`.
2. **Firewall Rules Integration**: The firewall engine will automatically define rules to isolate/permit VPN interfaces (`wg+`) inside the `forward` chain based on SD-WAN policies.
3. **DNS Leaks Prevention**: Upstream DNS settings on peers will point directly to the CyberTrack DNS server.
