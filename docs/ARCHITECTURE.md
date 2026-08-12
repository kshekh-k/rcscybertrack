# RCS CyberTrack — Architecture Specification

This document details the modular subsystem architecture, component dependencies, and security data flow patterns implemented in RCS CyberTrack.

## System Block Diagram

```text
RCS CyberTrack
      │
      ├── OS & Build System (Systemd hardened service, validation engine)
      │
      ├── Firewall Engine (nftables compiler, mock fallback engine)
      │
      ├── Network Manager (systemd-networkd / interface state compiler)
      │
      ├── VPN (WireGuard design & key management)
      │
      ├── SD-WAN (SLA probe engine, multi-WAN load balancer)
      │
      ├── Management API (FastAPI REST server, security controllers)
      │
      ├── Authentication (Bcrypt password hashing, JWT RBAC security)
      │
      ├── Device Management (Inventory tracker, discovery APIs)
      │
      └── Audit System (Tamper-resistant cryptographic log chain)
```

## Security & Data Flow Architecture

RCS CyberTrack is structured to enforce a strict boundary between user inputs (API) and OS operations (Linux networking and firewall layers). This prevents command injection vulnerabilities.

```text
GUI Dashboard (Next.js client in browser)
  │
  ▼ [HTTPS + JWT Token Bearer Headers]
REST API (FastAPI Server in Python)
  │
  ▼ [FastAPI Dependency Injection]
Authentication / RBAC Middleware (Checks claims/roles: Admin, Operator, Viewer)
  │
  ▼ [Pydantic schema parses and validates JSON/YAML data]
Service Layer (FirewallEngine, NetworkManager, DeviceRegistry, AuditLogger)
  │
  ▼ [Loads schema configurations and validates state transitions]
Configuration Models (Internal Python Pydantic structures)
  │
  ▼ [Translates configuration into clean command instructions / config files]
Subsystem Adapters (NftablesBackend, NetworkAdapter interfaces)
  │
  ▼ [Execution of compiled files or commands, e.g., nft -f, ip route]
Linux Subsystem (Kernel Netlink, nftables engine, systemd-networkd)
```

## Core Modules Description

### 1. Hardened Core Service
The management server runs inside a systemd unit sandboxed with `NoNewPrivileges=true`, `PrivateTmp=true`, and restricted system calls. Path write permissions are restricted strictly to configuration and rules directories.

### 2. Validation-First Configuration
No raw shell strings are ever parsed. Subsystem settings are read from structured YAML configuration files, validated against Pydantic models with custom IP, interface, and port range validators, and saved as serialized YAML records.

### 3. Cryptographic Audit Chain
Each audit event is linked to the previous log line's cryptographic SHA-256 hash. If an attacker edits, deletes, or inserts past logs, the hash chain breaks, triggering an integrity failure alert visible to administrators.
