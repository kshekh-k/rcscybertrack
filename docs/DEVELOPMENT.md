# RCS CyberTrack — Development Guide

This guide describes how to set up the development environment, run the management API, execute tests, and contribute new modules to RCS CyberTrack.

## Requirements

- Linux OS (Ubuntu 22.04+, Debian 12+, or RedHat/Fedora equivalent)
- Python >= 3.12
- `nftables` (optional, for real firewall testing)
- `systemd` (optional, for deployment check)

## Python Environment Setup

We recommend using a Python Virtual Environment (`venv`):

```bash
# Clone the repository and enter the directory
cd rcscybertrack

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install package in editable mode with development dependencies
pip install -e .[dev]
```

## Running the API

To start the FastAPI management server locally:

```bash
# Run server using uvicorn
uvicorn management.api.server:app --reload --host 127.0.0.1 --port 8000
```

Once running, the interactive documentation is available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Default Test Credentials

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Read + Write + Audit View |
| `operator` | `operator123` | `operator` | Read + Write |
| `viewer` | `viewer123` | `viewer` | Read-only |

To test API requests, POST to `/api/v1/auth/token` with the username and password to retrieve a JWT bearer token.

## Running Tests

To run the complete unit and integration test suite:

```bash
# Run pytest in root directory
pytest
```

Tests run completely isolated from the host system using mock system adapters. They will not modify your network or firewall rules.

## Security Guidelines

When writing code for CyberTrack, adhere to these strict security policies:

1. **No Shell Invocations**: Never use `os.system()` or `subprocess.Popen(..., shell=True)` with unvalidated variables. Use structured file writing and backend abstraction interfaces.
2. **Pydantic Validation**: All external input must map to a Pydantic model with strict type checks and IP/MAC regex validation.
3. **Audit Log Coverage**: All POST, PUT, and DELETE operations must log their final status, acting user, and resource targets in the cryptographic audit engine.
4. **Secret Management**: Do not hardcode passwords or private keys. Load configuration settings via environment variables where available.

## Troubleshooting

### nftables is not loaded or missing permissions
If applying rules fails on a development system due to permissions:
- Ensure the configuration `firewall.backend` in `os/config/rcscybertrack.yaml` is set to `"mock"` (default for testing).
- Real `nftables` application requires running the API server or helper scripts with root privileges (`sudo`).
