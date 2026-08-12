# RCS CyberTrack — Network & Security Platform

RCS CyberTrack is a modular, secure-by-default Linux-based security and network appliance. It features a stateful firewall compiler, network interfaces manager, tamper-resistant audit logs, role-based REST APIs, and blueprints for WireGuard VPN, SD-WAN path steering, and a web GUI.

---

## 🚀 Quick Start Guide

### 1. Setup Python Environment
Make sure you have **Python 3.12+** installed on your Linux system.

```bash
# Activate the pre-configured virtual environment (if present)
source .venv/bin/activate

# Or create a new virtual environment if needed
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
Install the package in editable mode with development utilities:

```bash
pip install -e .[dev]
```

### 3. Run Appliance Build Validation
Validate that the Python environment, system configurations, and systemd core configurations are valid:

```bash
bash os/build/build.sh
```

---

## 🛠 Running the REST API

Start the FastAPI management server using Uvicorn:

```bash
uvicorn management.api.server:app --reload --host 127.0.0.1 --port 8000
```

Once running, interactive documentation is available at:
* **Swagger UI (Interactive API Client)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc (Static documentation)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Default Credentials
| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Read + Write + Audit Trails |
| `operator` | `operator123` | `operator` | Read + Write |
| `viewer` | `viewer123` | `viewer` | Read-only |

To authenticate API requests, POST to `/api/v1/auth/token` to retrieve a JWT bearer token.

---

## 🧪 Running Tests

The test suite runs in complete isolation from your host network and firewall config using custom mocks and abstract system adapters.

```bash
pytest
```

Tests cover:
* **Firewall rules conversion** into valid `nftables` configurations.
* **Network configuration validation** (CIDRs, IPs, lease durations, MAC addresses).
* **REST API security** (JWT authentication flow and RBAC role validation).

---

## 📂 Project Directory Structure

```text
rcscybertrack/
├── os/
│   ├── build/            # Appliance build & verification scripts
│   ├── image/            # Directory reserved for system images
│   ├── config/           # Central rcscybertrack.yaml configuration
│   └── services/         # Hardened systemd core service definition
├── firewall/
│   ├── policy/           # Default posture (deny input/forward by default)
│   ├── rules/            # Stateful firewall rules definitions
│   └── engine/           # Nftables ruleset compiler and abstraction
├── network/
│   ├── interfaces/       # Network interfaces definition
│   ├── routing/          # Static routes definitions
│   ├── dhcp/             # DHCP address pools & static reservations
│   └── dns/              # Local hostnames & resolver configurations
├── management/
│   ├── api/              # FastAPI REST server routes
│   ├── auth/             # Cryptographic password hashing & JWT tokens
│   ├── device/           # Managed asset registry & metadata
│   └── audit/            # Tamper-resistant append-only hash chains logs
├── tests/                # Test suites (Firewall, Network, API)
└── docs/                 # ARCHITECTURE.md and DEVELOPMENT.md
```
