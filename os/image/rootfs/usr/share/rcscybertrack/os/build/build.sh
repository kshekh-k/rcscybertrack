#!/usr/bin/env bash
# RCS CyberTrack — Build and Validation Engine
# Safe deployment and configuration compiler

set -euo pipefail

# Define text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command-line arguments
INSTALL_MODE=false

for arg in "$@"; do
    case "$arg" in
        --install)
            INSTALL_MODE=true
            ;;
        *)
            echo -e "${RED}Error: Unknown argument '$arg'${NC}" >&2
            echo -e "Usage: $0 [--install]" >&2
            exit 1
            ;;
    esac
done

if [ "$INSTALL_MODE" = true ] && [ "${EUID:-$(id -u)}" -ne 0 ]; then
    echo -e "${RED}Error: --install mode requires root privileges (run with sudo).${NC}" >&2
    exit 1
fi

echo -e "${BLUE}=== RCS CyberTrack Appliance Builder ===${NC}"

# 1. Detect Linux Distribution
echo -e "\n[*] Checking OS environment..."
if [ -f /etc/os-release ]; then
    # Load OS Release variables
    . /etc/os-release
    echo -e "    Distribution: ${GREEN}${NAME:-Unknown}${NC}"
    echo -e "    Version:      ${GREEN}${VERSION_ID:-Unknown}${NC}"
else
    echo -e "    ${YELLOW}Warning: OS release file not found. Assuming standard Linux.${NC}"
fi

# 2. Check Python version (requires >= 3.12)
echo -e "\n[*] Checking Python environment..."
if [ ! -x .venv/bin/python ]; then
    echo -e "    ${RED}Error: Python3 is not installed.${NC}"
    exit 1
fi

PYTHON_VERSION=$(.venv/bin/python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "    Python version: ${GREEN}${PYTHON_VERSION}${NC}"

.venv/bin/python -c '
import sys
if sys.version_info < (3, 12):
    print(f"Error: Python >= 3.12 is required, found {sys.version}", file=sys.stderr)
    sys.exit(1)
'

# 3. Check for nftables
echo -e "\n[*] Checking firewall backend utilities..."
if command -v nft &> /dev/null; then
    NFT_VERSION=$(nft --version | head -n 1)
    echo -e "    Backend: ${GREEN}nftables is installed (${NFT_VERSION})${NC}"
else
    echo -e "    ${YELLOW}Warning: nftables (nft) command line utility was not found.${NC}"
    echo -e "             Firewall engine will run in Mock/Simulation mode.${NC}"
fi

# 4. Check for systemd
echo -e "\n[*] Checking system supervisor..."
if command -v systemctl &> /dev/null; then
    echo -e "    Supervisor: ${GREEN}systemd is available${NC}"
else
    echo -e "    ${YELLOW}Warning: systemd is not available.${NC}"
fi

# 5. Check Python dependencies
echo -e "\n[*] Checking Python modules..."
.venv/bin/python -c '
import sys
modules = ["fastapi", "uvicorn", "pydantic", "yaml", "jwt", "bcrypt"]
missing = []
for m in modules:
    try:
        __import__(m)
    except ImportError:
        missing.append(m)
if missing:
    print(f"    Missing modules: {chr(44).join(missing)}")
    sys.exit(1)
else:
    print("    All required packages are installed.")
' || {
    echo -e "    ${YELLOW}Warning: Some required dependencies are not installed in the global environment.${NC}"
    echo -e "             Please install requirements using: pip install -e .[dev] or similar.${NC}"
}

# 6. Validate configurations via Pydantic model
echo -e "\n[*] Validating system and firewall configurations..."
if [ -f os/config/rcscybertrack.yaml ]; then
    if PYTHONPATH=. .venv/bin/python -c "from management.config import load_config, Path; load_config(Path('os/config/rcscybertrack.yaml'))" &> /dev/null; then
        echo -e "    Configuration: ${GREEN}os/config/rcscybertrack.yaml is VALID${NC}"
    else
        echo -e "    ${RED}Error: Pydantic configuration validation failed!${NC}"
        PYTHONPATH=. .venv/bin/python -c "from management.config import load_config, Path; load_config(Path('os/config/rcscybertrack.yaml'))"
        exit 1
    fi
else
    echo -e "    ${RED}Error: Configuration file os/config/rcscybertrack.yaml not found.${NC}"
    exit 1
fi

# 7. Check service systemd syntax
echo -e "\n[*] Validating systemd unit file structure..."
if [ -f os/services/rcscybertrack-core.service ]; then
    echo -e "    Service Unit: ${GREEN}os/services/rcscybertrack-core.service exists${NC}"
else
    echo -e "    ${RED}Error: systemd service file not found.${NC}"
    exit 1
fi

# 8. Dry-run directory preparation
echo -e "\n[*] Simulating configuration and runtime directories creation..."
echo -e "    Would create /etc/rcscybertrack"
echo -e "    Would create /var/log/rcscybertrack"
echo -e "    Would copy os/services/rcscybertrack-core.service to /etc/systemd/system/"

echo -e "\n${GREEN}=== RCS CyberTrack build check completed successfully! ===${NC}"

# 9. System installation
if [ "$INSTALL_MODE" = true ]; then
    echo -e "\n[*] Installing RCS CyberTrack system files and service..."

    echo -e "    Creating directory /etc/rcscybertrack..."
    mkdir -p "/etc/rcscybertrack"

    echo -e "    Creating directory /var/log/rcscybertrack..."
    mkdir -p "/var/log/rcscybertrack"

    echo -e "    Copying configuration file to /etc/rcscybertrack/rcscybertrack.yaml..."
    cp "os/config/rcscybertrack.yaml" "/etc/rcscybertrack/rcscybertrack.yaml"

    echo -e "    Copying systemd service unit to /etc/systemd/system/rcscybertrack-core.service..."
    cp "os/services/rcscybertrack-core.service" "/etc/systemd/system/rcscybertrack-core.service"

    echo -e "    Setting ownership and permissions..."
    chmod 755 "/etc/rcscybertrack"
    chmod 644 "/etc/rcscybertrack/rcscybertrack.yaml"
    chmod 755 "/var/log/rcscybertrack"
    chmod 644 "/etc/systemd/system/rcscybertrack-core.service"

    chown root:root "/etc/rcscybertrack"
    chown root:root "/etc/rcscybertrack/rcscybertrack.yaml"
    chown root:root "/etc/systemd/system/rcscybertrack-core.service"
    if id rcscybertrack &>/dev/null; then
        chown -R rcscybertrack:rcscybertrack "/var/log/rcscybertrack"
    else
        chown -R root:root "/var/log/rcscybertrack"
    fi

    echo -e "    Reloading systemd daemon..."
    systemctl daemon-reload

    echo -e "    Enabling rcscybertrack-core.service..."
    systemctl enable rcscybertrack-core.service

    echo -e "    Starting rcscybertrack-core.service..."
    systemctl start rcscybertrack-core.service

    echo -e "    Checking service status..."
    SERVICE_STATUS=$(systemctl is-active rcscybertrack-core.service || true)
    if [ "$SERVICE_STATUS" = "active" ]; then
        echo -e "    Service status: ${GREEN}${SERVICE_STATUS}${NC}"
        echo -e "\n${GREEN}=== RCS CyberTrack installation completed successfully! ===${NC}"
    else
        echo -e "    Service status: ${RED}${SERVICE_STATUS}${NC}"
        echo -e "\n${RED}=== RCS CyberTrack installation failed: service is not active ===${NC}" >&2
        exit 1
    fi
fi
