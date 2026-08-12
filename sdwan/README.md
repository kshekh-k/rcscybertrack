# RCS CyberTrack — SD-WAN Engine Architecture

This document defines the architecture, metrics, and routing configurations planned for the RCS CyberTrack Software-Defined WAN (SD-WAN) subsystem.

## Engine Status & Roadmap

| Module | Status | Details |
| :--- | :--- | :--- |
| Multi-WAN Static Configuration | **Planned** | Static definition of multiple interfaces and weights |
| Active Link Monitoring (ICMP/HTTP Probe) | **Experimental** | Python background worker measuring latency & loss |
| Policy-Based Routing (PBR) | **Planned** | Mapping specific application traffic to defined WAN interfaces |
| Dynamic Failover & Traffic Steering | **Planned** | Real-time gateway switching based on link SLA metrics |

## Architectural Overview

RCS CyberTrack is designed to orchestrate traffic routing across multiple internet endpoints dynamically:

```text
                               ┌───► WAN 1 (Fiber) ───► Internet (Primary)
                               │     SLA: Latency < 20ms, Loss = 0%
[ Local LAN ] ──► [ SD-WAN ] ──┼
                               │
                               └───► WAN 2 (LTE) ───► Internet (Backup / Bulk)
                                     SLA: Latency > 80ms, Loss = 1%
```

## Link Monitoring SLA Metrics

The background daemon periodically probes upstream test nodes (e.g., DNS root servers or Cloudflare/Google endpoints) using ICMP echo requests and TCP handshakes:

1. **Latency**: Round-trip time (RTT) calculated over a rolling window of 10 samples.
2. **Packet Loss**: Percentage of dropped packets over a 20-sample window.
3. **Jitter**: Variation in RTT latency across successive probes.

### SLA Threshold Example (`sdwan.yaml`)

```yaml
sdwan:
  interfaces:
    - name: eth0 (wan1)
      weight: 100
      gateway: 203.0.113.1
      sla:
        max_latency_ms: 50
        max_loss_percent: 1
    - name: eth2 (wan2)
      weight: 50
      gateway: 198.51.100.1
      sla:
        max_latency_ms: 150
        max_loss_percent: 5

  rules:
    - app: VoipTraffic
      protocol: udp
      port: 5060
      preferred_link: wan1
      fallback: wan2
      max_latency: 60
```

## Traffic Steering and Failover

- **Multipath Routing (ECMP)**: Standard load-balancing across equivalent links using `ip route add default scope global nexthop ...`.
- **Policy-Based Routing (PBR)**: Implemented using Linux policy routing rules (`ip rule` and custom routing tables).
- **Dynamic Steering**: When a link breaches its configured SLA threshold, the SD-WAN daemon modifies the gateway priority, shifting mission-critical traffic (like VoIP) to compliant interfaces without active connection breakdown.
