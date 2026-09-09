#!/usr/bin/env bash

# ============================================================
# RCS CyberTrack Appliance Builder V2
# Ubuntu 26.04 Resolute
# Builds a complete bootable RAW appliance image.
#
# SAFETY:
# - Build staging is under /tmp
# - This script DOES NOT write to any physical disk
# - USB installation is a separate/manual operation
# ============================================================

set -Eeuo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BUILD_DIR="/tmp/rcscybertrack-build"
ROOTFS="${BUILD_DIR}/rootfs"
IMAGE_DIR="${BASE_DIR}/os/image/output"

IMAGE="${IMAGE_DIR}/rcscybertrack-v0.6.2-amd64.raw"

SUITE="resolute"
MIRROR="https://archive.ubuntu.com/ubuntu"

KVER="$(uname -r)"

echo
echo "============================================================"
echo " RCS CYBERTRACK APPLIANCE BUILDER V2"
echo "============================================================"
echo
echo "BASE_DIR : ${BASE_DIR}"
echo "ROOTFS   : ${ROOTFS}"
echo "IMAGE    : ${IMAGE}"
echo "KERNEL   : ${KVER}"
echo
echo "Physical disks will NOT be touched."
echo

# ------------------------------------------------------------
# Safety checks
# ------------------------------------------------------------

if [[ "${EUID}" -ne 0 ]]; then
    echo "ERROR: Run this builder with sudo."
    exit 1
fi

if [[ ! -d "${BASE_DIR}/management" ]]; then
    echo "ERROR: CyberTrack project directory not found."
    exit 1
fi

if [[ ! -f "${BASE_DIR}/pyproject.toml" ]]; then
    echo "ERROR: pyproject.toml not found."
    exit 1
fi

if [[ ! -x "/usr/sbin/debootstrap" ]]; then
    echo "ERROR: debootstrap not installed."
    exit 1
fi

if [[ ! -f "/boot/vmlinuz-${KVER}" ]]; then
    echo "ERROR: Host kernel not found:"
    echo "/boot/vmlinuz-${KVER}"
    exit 1
fi

if [[ ! -d "/lib/modules/${KVER}" ]]; then
    echo "ERROR: Host kernel modules not found:"
    echo "/lib/modules/${KVER}"
    exit 1
fi

mkdir -p "${IMAGE_DIR}"

# ------------------------------------------------------------
# Cleanup helper
# ------------------------------------------------------------

cleanup_mounts() {
    set +e

    for p in \
        "${ROOTFS}/run" \
        "${ROOTFS}/sys" \
        "${ROOTFS}/proc" \
        "${ROOTFS}/dev/pts" \
        "${ROOTFS}/dev"
    do
        if mountpoint -q "$p"; then
            umount -lf "$p"
        fi
    done
}

trap cleanup_mounts EXIT

# ------------------------------------------------------------
# Prepare rootfs
# ------------------------------------------------------------

echo
echo "[1/12] Preparing build rootfs..."

rm -rf "${ROOTFS}"
mkdir -p "${ROOTFS}"

# The base Ubuntu rootfs was already created by debootstrap.
# Do NOT debootstrap again here.

if [[ ! -x "${ROOTFS}/usr/bin/bash" ]]; then
    echo "ERROR: Ubuntu base rootfs is missing."
    echo "Run the successful debootstrap step first."
    exit 1
fi

echo "Base rootfs found."

# ------------------------------------------------------------
# DNS
# ------------------------------------------------------------

echo
echo "[2/12] Preparing DNS..."

rm -f "${ROOTFS}/etc/resolv.conf"

cat > "${ROOTFS}/etc/resolv.conf" <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF

# ------------------------------------------------------------
# APT sources
# ------------------------------------------------------------

echo
echo "[3/12] Configuring Ubuntu repositories..."

mkdir -p "${ROOTFS}/etc/apt/sources.list.d"

cat > "${ROOTFS}/etc/apt/sources.list" <<EOF
deb ${MIRROR} ${SUITE} main restricted universe multiverse
deb ${MIRROR} ${SUITE}-updates main restricted universe multiverse
deb ${MIRROR} ${SUITE}-security main restricted universe multiverse
EOF

# Prevent services from attempting to start inside chroot.
cat > "${ROOTFS/usr/sbin}/policy-rc.d" <<'EOF'
#!/bin/sh
exit 101
EOF

chmod 755 "${ROOTFS}/usr/sbin/policy-rc.d"

# ------------------------------------------------------------
# Mount runtime filesystems
# ------------------------------------------------------------

echo
echo "[4/12] Mounting temporary runtime filesystems..."

mkdir -p \
    "${ROOTFS}/dev" \
    "${ROOTFS}/dev/pts" \
    "${ROOTFS}/proc" \
    "${ROOTFS}/sys" \
    "${ROOTFS}/run"

mount --rbind /dev "${ROOTFS}/dev"
mount --make-rslave "${ROOTFS}/dev"

mount -t proc proc "${ROOTFS}/proc"

mount --rbind /sys "${ROOTFS}/sys"
mount --make-rslave "${ROOTFS}/sys"

mount --rbind /run "${ROOTFS}/run"
mount --make-rslave "${ROOTFS}/run"

# ------------------------------------------------------------
# Install complete appliance packages
# ------------------------------------------------------------

echo
echo "[5/12] Installing appliance OS packages..."
echo

chroot "${ROOTFS}" /bin/bash <<'CHROOT'
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update

apt-get install -y \
    systemd \
    systemd-sysv \
    dbus \
    udev \
    kmod \
    initramfs-tools \
    initramfs-tools-core \
    linux-base \
    iproute2 \
    iputils-ping \
    net-tools \
    ethtool \
    bridge-utils \
    nftables \
    iptables \
    dnsmasq \
    openssh-server \
    curl \
    wget \
    ca-certificates \
    sudo \
    bash \
    coreutils \
    procps \
    util-linux \
    pciutils \
    usbutils \
    vim-tiny \
    less \
    rsync \
    python3 \
    python3-venv \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    python3-dev \
    build-essential

apt-get clean
rm -rf /var/lib/apt/lists/*
CHROOT

# ------------------------------------------------------------
# Kernel + modules
# ------------------------------------------------------------

echo
echo "[6/12] Installing appliance kernel..."

cp -a \
    "/boot/vmlinuz-${KVER}" \
    "${ROOTFS}/boot/vmlinuz-${KVER}"

if [[ -f "/boot/System.map-${KVER}" ]]; then
    cp -a \
        "/boot/System.map-${KVER}" \
        "${ROOTFS}/boot/System.map-${KVER}"
fi

if [[ -f "/boot/config-${KVER}" ]]; then
    cp -a \
        "/boot/config-${KVER}" \
        "${ROOTFS}/boot/config-${KVER}"
fi

rm -rf "${ROOTFS}/lib/modules/${KVER}"
cp -a \
    "/lib/modules/${KVER}" \
    "${ROOTFS}/lib/modules/${KVER}"

chroot "${ROOTFS}" depmod -a "${KVER}"

# ------------------------------------------------------------
# CyberTrack application
# ------------------------------------------------------------

echo
echo "[7/12] Installing RCS CyberTrack application..."

APP="${ROOTFS}/usr/share/rcscybertrack"

mkdir -p "${APP}"

# Core application directories.
cp -a "${BASE_DIR}/management" "${APP}/"
cp -a "${BASE_DIR}/firewall" "${APP}/"
cp -a "${BASE_DIR}/network" "${APP}/"

# Optional modules.
if [[ -d "${BASE_DIR}/vpn" ]]; then
    cp -a "${BASE_DIR}/vpn" "${APP}/"
fi

if [[ -d "${BASE_DIR}/sdwan" ]]; then
    cp -a "${BASE_DIR}/sdwan" "${APP}/"
fi

if [[ -d "${BASE_DIR}/gui/dist" ]]; then
    mkdir -p "${APP}/gui"
    cp -a "${BASE_DIR}/gui/dist" "${APP}/gui/"
fi

# OS configuration and services.
mkdir -p "${APP}/os"

for d in config services scripts build; do
    if [[ -d "${BASE_DIR}/os/${d}" ]]; then
        cp -a "${BASE_DIR}/os/${d}" "${APP}/os/"
    fi
done

cp -a "${BASE_DIR}/pyproject.toml" "${APP}/"

if [[ -f "${BASE_DIR}/README.md" ]]; then
    cp -a "${BASE_DIR}/README.md" "${APP}/"
fi

# ------------------------------------------------------------
# CyberTrack configuration
# ------------------------------------------------------------

echo
echo "[8/12] Installing CyberTrack configuration..."

mkdir -p \
    "${ROOTFS}/etc/rcscybertrack" \
    "${APP}/data" \
    "${APP}/firewall/rules" \
    "${APP}/network"

if [[ -f "${BASE_DIR}/os/config/rcscybertrack.yaml" ]]; then
    cp -a \
        "${BASE_DIR}/os/config/rcscybertrack.yaml" \
        "${ROOTFS}/etc/rcscybertrack/"
fi

if [[ -f "${BASE_DIR}/os/services/rcscybertrack-core.service" ]]; then
    cp -a \
        "${BASE_DIR}/os/services/rcscybertrack-core.service" \
        "${ROOTFS}/etc/systemd/system/"
fi

# ------------------------------------------------------------
# CyberTrack user
# ------------------------------------------------------------

echo
echo "[9/12] Creating CyberTrack service account..."

chroot "${ROOTFS}" /bin/bash <<'CHROOT'
set -Eeuo pipefail

if ! getent group rcscybertrack >/dev/null 2>&1; then
    groupadd --system rcscybertrack
fi

if ! id rcscybertrack >/dev/null 2>&1; then
    useradd \
        --system \
        --gid rcscybertrack \
        --home-dir /usr/share/rcscybertrack \
        --shell /usr/sbin/nologin \
        rcscybertrack
fi
CHROOT

# ------------------------------------------------------------
# Python virtual environment
# ------------------------------------------------------------

echo
echo "[10/12] Creating CyberTrack Python environment..."
echo

chroot "${ROOTFS}" /bin/bash <<'CHROOT'
set -Eeuo pipefail

export HOME=/root
export DEBIAN_FRONTEND=noninteractive

APP=/usr/share/rcscybertrack

rm -rf "${APP}/.venv"

python3 -m venv "${APP}/.venv"

"${APP}/.venv/bin/python" -m pip install \
    --upgrade \
    pip \
    setuptools \
    wheel

"${APP}/.venv/bin/python" -m pip install \
    --no-cache-dir \
    --no-build-isolation \
    "${APP}"

"${APP}/.venv/bin/python" - <<'PY'
import fastapi
import uvicorn
import pydantic
import yaml
import jwt
import bcrypt
import sqlalchemy
import alembic

print("CyberTrack Python dependencies: OK")
print("FastAPI:", fastapi.__version__)
print("Uvicorn:", uvicorn.__version__)
print("Pydantic:", pydantic.__version__)
PY

chown -R rcscybertrack:rcscybertrack "${APP}"

chmod 755 "${APP}"
CHROOT

# ------------------------------------------------------------
# Service configuration
# ------------------------------------------------------------

echo
echo "[11/12] Configuring CyberTrack boot service..."

mkdir -p "${ROOTFS}/etc/systemd/system/multi-user.target.wants"

ln -sf \
    /etc/systemd/system/rcscybertrack-core.service \
    "${ROOTFS}/etc/systemd/system/multi-user.target.wants/rcscybertrack-core.service"

cat > "${ROOTFS}/etc/sysctl.d/99-rcscybertrack-forwarding.conf" <<'EOF'
net.ipv4.ip_forward = 1
EOF

cat > "${ROOTFS}/etc/hostname" <<'EOF'
rcscybertrack
EOF

cat > "${ROOTFS}/etc/hosts" <<'EOF'
127.0.0.1 localhost
127.0.1.1 rcscybertrack

::1 localhost ip6-localhost ip6-loopback
EOF

# Basic target network configuration.
mkdir -p "${ROOTFS}/etc/systemd/network"

cat > "${ROOTFS}/etc/systemd/network/10-rcscybertrack.network" <<'EOF'
[Match]
Name=eth0

[Network]
DHCP=no
IPv6AcceptRA=no
EOF

cat > "${ROOTFS}/etc/systemd/network/20-rcscybertrack-lan.network" <<'EOF'
[Match]
Name=eth1

[Network]
DHCP=no
IPv6AcceptRA=no
EOF

# Make systemd-networkd available without depending on it for the
# CyberTrack application's own network configuration.
ln -sf \
    /lib/systemd/system/systemd-networkd.service \
    "${ROOTFS}/etc/systemd/system/multi-user.target.wants/systemd-networkd.service"

ln -sf \
    /lib/systemd/system/systemd-networkd.socket \
    "${ROOTFS}/etc/systemd/system/sockets.target.wants/systemd-networkd.socket"

# SSH.
mkdir -p "${ROOTFS}/etc/ssh"

# Clean machine identity so every installed appliance gets its own ID.
truncate -s 0 "${ROOTFS}/etc/machine-id"

rm -f "${ROOTFS}/var/lib/dbus/machine-id"

# Remove build-time policy override.
rm -f "${ROOTFS}/usr/sbin/policy-rc.d"

# ------------------------------------------------------------
# Initramfs
# ------------------------------------------------------------

echo
echo "[12/12] Building TARGET initramfs..."

# Remove stale initrds that may have originated from another build.
rm -f "${ROOTFS}/boot/initrd.img-"*

chroot "${ROOTFS}" update-initramfs -c -k "${KVER}"

if [[ ! -f "${ROOTFS}/boot/initrd.img-${KVER}" ]]; then
    echo "ERROR: target initramfs was not generated."
    exit 1
fi

echo
echo "============================================================"
echo " ROOTFS BUILD COMPLETE"
echo "============================================================"

echo
echo "Checking critical OS files..."

checks=(
    "/sbin/init"
    "/usr/lib/systemd/systemd"
    "/bin/bash"
    "/boot/vmlinuz-${KVER}"
    "/boot/initrd.img-${KVER}"
    "/lib/modules/${KVER}"
    "/usr/share/rcscybertrack/.venv/bin/python"
    "/etc/systemd/system/rcscybertrack-core.service"
    "/etc/systemd/system/multi-user.target.wants/rcscybertrack-core.service"
)

for f in "${checks[@]}"; do
    if [[ -e "${ROOTFS}${f}" ]]; then
        echo "OK: ${f}"
    else
        echo "FAIL: ${f}"
        exit 1
    fi
done

echo
echo "Checking init symlink:"
ls -l "${ROOTFS}/sbin/init"

echo
echo "Checking systemd:"
ls -l "${ROOTFS}/usr/lib/systemd/systemd"

echo
echo "Checking kernel:"
ls -lh "${ROOTFS}/boot/vmlinuz-${KVER}"

echo
echo "Checking initramfs:"
ls -lh "${ROOTFS}/boot/initrd.img-${KVER}"

echo
echo "Checking CyberTrack service:"
grep -E \
    '^(User|Group|ExecStart|AmbientCapabilities|CapabilityBoundingSet|NoNewPrivileges|ProtectSystem|ProtectKernelTunables)' \
    "${ROOTFS}/etc/systemd/system/rcscybertrack-core.service" \
    || true

echo
echo "Checking forwarding:"
cat "${ROOTFS}/etc/sysctl.d/99-rcscybertrack-forwarding.conf"

echo
echo "ROOTFS SIZE:"
du -sh "${ROOTFS}"

echo
echo "============================================================"
echo " V2 ROOTFS SUCCESSFULLY BUILT"
echo "============================================================"
echo
echo "NO USB WAS WRITTEN."
echo
