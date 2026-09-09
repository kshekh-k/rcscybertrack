#!/usr/bin/env bash

set -Eeuo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BUILD_DIR="/tmp/rcscybertrack-build"
ROOTFS="${BUILD_DIR}/rootfs"

OUTPUT_DIR="${BASE_DIR}/os/image/output"
IMAGE="${OUTPUT_DIR}/rcscybertrack-v0.6.2-amd64.raw"

SUITE="resolute"
MIRROR="https://archive.ubuntu.com/ubuntu"

KVER="$(uname -r)"

echo
echo "============================================================"
echo " RCS CYBERTRACK APPLIANCE BUILDER V2.1"
echo "============================================================"
echo
echo "BASE    : ${BASE_DIR}"
echo "ROOTFS  : ${ROOTFS}"
echo "IMAGE   : ${IMAGE}"
echo "KERNEL  : ${KVER}"
echo
echo "SAFETY: NO PHYSICAL DISK WILL BE WRITTEN."
echo

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: Run with sudo."
    exit 1
fi

command -v debootstrap >/dev/null || {
    echo "ERROR: debootstrap missing."
    exit 1
}

command -v sgdisk >/dev/null || {
    echo "ERROR: sgdisk missing."
    exit 1
}

command -v losetup >/dev/null || {
    echo "ERROR: losetup missing."
    exit 1
}

command -v grub-install >/dev/null || {
    echo "ERROR: grub-install missing."
    exit 1
}

[[ -f "/boot/vmlinuz-${KVER}" ]] || {
    echo "ERROR: kernel missing."
    exit 1
}

[[ -d "/lib/modules/${KVER}" ]] || {
    echo "ERROR: kernel modules missing."
    exit 1
}

mkdir -p "${OUTPUT_DIR}"

LOOPDEV=""
ROOT_MNT=""
EFI_MNT=""

cleanup() {
    set +e

    if [[ -n "${EFI_MNT}" ]] && mountpoint -q "${EFI_MNT}"; then
        umount -lf "${EFI_MNT}"
    fi

    if [[ -n "${ROOT_MNT}" ]] && mountpoint -q "${ROOT_MNT}"; then
        umount -lf "${ROOT_MNT}"
    fi

    if [[ -n "${LOOPDEV}" ]]; then
        losetup -d "${LOOPDEV}" 2>/dev/null || true
    fi
}

trap cleanup EXIT

# ============================================================
# 1. FRESH UBUNTU ROOTFS
# ============================================================

echo
echo "[1/14] Creating fresh Ubuntu Resolute rootfs..."

# Release mounts left by any interrupted previous build.
if [[ -d "${ROOTFS}" ]]; then
    umount -R "${ROOTFS}" 2>/dev/null || true
fi

if [[ -d "${BUILD_DIR}/image-root" ]]; then
    umount -R "${BUILD_DIR}/image-root" 2>/dev/null || true
fi

# Release any loop device associated with the previous appliance image.
OLD_LOOPS="$(losetup -j "${IMAGE}" -O NAME 2>/dev/null || true)"
if [[ -n "${OLD_LOOPS}" ]]; then
    while IFS= read -r old_loop; do
        [[ -n "${old_loop}" ]] && losetup -d "${old_loop}" 2>/dev/null || true
    done <<< "${OLD_LOOPS}"
fi

rm -rf "${BUILD_DIR}"
mkdir -p "${ROOTFS}"

debootstrap \
    --arch=amd64 \
    --variant=minbase \
    "${SUITE}" \
    "${ROOTFS}" \
    "${MIRROR}"

echo "Base Ubuntu installed."

# ============================================================
# 2. APT / DNS
# ============================================================

echo
echo "[2/14] Configuring APT and DNS..."

rm -f "${ROOTFS}/etc/resolv.conf"

cat > "${ROOTFS}/etc/resolv.conf" <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF

cat > "${ROOTFS}/etc/apt/sources.list" <<EOF
deb ${MIRROR} ${SUITE} main restricted universe multiverse
deb ${MIRROR} ${SUITE}-updates main restricted universe multiverse
deb ${MIRROR} ${SUITE}-security main restricted universe multiverse
EOF

cat > "${ROOTFS}/usr/sbin/policy-rc.d" <<'EOF'
#!/bin/sh
exit 101
EOF

chmod 755 "${ROOTFS}/usr/sbin/policy-rc.d"

# ============================================================
# 3. CHROOT MOUNTS
# ============================================================

echo
echo "[3/14] Preparing chroot..."

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

# ============================================================
# 4. COMPLETE OS PACKAGES
# ============================================================

echo
echo "[4/14] Installing complete appliance OS..."

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

echo "Complete OS packages installed."

# ============================================================
# 5. VERIFY SYSTEMD
# ============================================================

echo
echo "[5/14] Verifying systemd..."

test -x "${ROOTFS}/usr/lib/systemd/systemd"
test -e "${ROOTFS}/sbin/init"

ls -l "${ROOTFS}/sbin/init"
ls -l "${ROOTFS}/usr/lib/systemd/systemd"

# ============================================================
# 6. KERNEL + MODULES
# ============================================================

echo
echo "[6/14] Installing kernel and modules..."

cp -a \
    "/boot/vmlinuz-${KVER}" \
    "${ROOTFS}/boot/"

if [[ -f "/boot/System.map-${KVER}" ]]; then
    cp -a "/boot/System.map-${KVER}" "${ROOTFS}/boot/"
fi

if [[ -f "/boot/config-${KVER}" ]]; then
    cp -a "/boot/config-${KVER}" "${ROOTFS}/boot/"
fi

rm -rf "${ROOTFS}/lib/modules/${KVER}"

mkdir -p "${ROOTFS}/lib/modules"

cp -a \
    "/lib/modules/${KVER}" \
    "${ROOTFS}/lib/modules/"

echo "Kernel modules copied:"
du -sh "${ROOTFS}/lib/modules/${KVER}"

echo "Generating module dependencies..."

depmod -b "${ROOTFS}" -a "${KVER}"

test -f "${ROOTFS}/lib/modules/${KVER}/modules.dep"
test -f "${ROOTFS}/lib/modules/${KVER}/modules.alias"
test -f "${ROOTFS}/lib/modules/${KVER}/modules.symbols"

echo "Kernel modules + depmod OK."

# ============================================================
# 7. CYBERTRACK APPLICATION
# ============================================================

echo
echo "[7/14] Installing RCS CyberTrack..."

APP="${ROOTFS}/usr/share/rcscybertrack"

mkdir -p "${APP}"

cp -a "${BASE_DIR}/management" "${APP}/"
cp -a "${BASE_DIR}/firewall" "${APP}/"
cp -a "${BASE_DIR}/network" "${APP}/"

for optional in vpn sdwan; do
    if [[ -d "${BASE_DIR}/${optional}" ]]; then
        cp -a "${BASE_DIR}/${optional}" "${APP}/"
    fi
done

if [[ -d "${BASE_DIR}/gui/dist" ]]; then
    mkdir -p "${APP}/gui"
    cp -a "${BASE_DIR}/gui/dist" "${APP}/gui/"
fi

mkdir -p "${APP}/os"

for d in config services scripts build; do
    if [[ -d "${BASE_DIR}/os/${d}" ]]; then
        cp -a "${BASE_DIR}/os/${d}" "${APP}/os/"
    fi
done

cp -a "${BASE_DIR}/pyproject.toml" "${APP}/"

# ============================================================
# 8. CYBERTRACK USER + CONFIG
# ============================================================

echo
echo "[8/14] Configuring CyberTrack account and configuration..."

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

cp -a \
    "${BASE_DIR}/os/services/rcscybertrack-core.service" \
    "${ROOTFS}/etc/systemd/system/"

# ============================================================
# 9. PYTHON VENV
# ============================================================

echo
echo "[9/14] Building CyberTrack Python environment..."

chroot "${ROOTFS}" /bin/bash <<'CHROOT'
set -Eeuo pipefail

export HOME=/root

APP=/usr/share/rcscybertrack

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

print("CyberTrack Python stack: OK")
print("FastAPI:", fastapi.__version__)
print("Uvicorn:", uvicorn.__version__)
print("Pydantic:", pydantic.__version__)
PY
CHROOT

chown -R rcscybertrack:rcscybertrack "${APP}"

# ============================================================
# 10. SYSTEM CONFIG
# ============================================================

echo
echo "[10/14] Configuring system and CyberTrack service..."

mkdir -p \
    "${ROOTFS}/etc/systemd/system/multi-user.target.wants" \
    "${ROOTFS}/etc/systemd/network"

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

# Network interfaces stay under CyberTrack's control.
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

# Clean machine identity for first appliance boot.
truncate -s 0 "${ROOTFS}/etc/machine-id"
rm -f "${ROOTFS}/var/lib/dbus/machine-id"

rm -f "${ROOTFS}/usr/sbin/policy-rc.d"

# ============================================================
# 11. INITRAMFS
# ============================================================

echo
echo "[11/14] Building TARGET initramfs..."

rm -f "${ROOTFS}/boot/initrd.img-"*

chroot "${ROOTFS}" update-initramfs -c -k "${KVER}"

test -f "${ROOTFS}/boot/initrd.img-${KVER}"

echo "Target initramfs generated."

# ============================================================
# 12. FINAL ROOTFS VALIDATION
# ============================================================

echo
echo "[12/14] Validating complete rootfs..."

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
    "/etc/sysctl.d/99-rcscybertrack-forwarding.conf"
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
echo "Checking current initramfs for stale old UUID..."

if strings "${ROOTFS}/boot/initrd.img-${KVER}" | grep -q "1C4C-F920"; then
    echo "FAIL: stale UUID found in current initramfs"
    exit 1
else
    echo "OK: no stale 1C4C-F920 UUID"
fi

# ============================================================
# 13. CREATE RAW IMAGE
# ============================================================

echo
echo "[13/14] Creating 6 GiB GPT RAW appliance image..."

rm -f "${IMAGE}"

truncate -s 6G "${IMAGE}"

sgdisk --zap-all "${IMAGE}"

sgdisk \
    -n 1:2048:+512M \
    -t 1:EF00 \
    -c 1:CYBER_EFI \
    -n 2:0:+5G \
    -t 2:8300 \
    -c 2:CYBER_ROOT \
    -n 3:0:+1M \
    -t 3:EF02 \
    -c 3:BIOS_BOOT \
    "${IMAGE}"

LOOPDEV="$(losetup --find --show --partscan "${IMAGE}")"

echo "Loop device: ${LOOPDEV}"

udevadm settle

mkfs.vfat \
    -F32 \
    -n CYBER_EFI \
    "${LOOPDEV}p1"

mkfs.ext4 \
    -F \
    -L CYBER_ROOT \
    "${LOOPDEV}p2"

ROOT_UUID="$(blkid -s UUID -o value "${LOOPDEV}p2")"
EFI_UUID="$(blkid -s UUID -o value "${LOOPDEV}p1")"

echo "ROOT UUID: ${ROOT_UUID}"
echo "EFI UUID : ${EFI_UUID}"

ROOT_MNT="${BUILD_DIR}/image-root"
EFI_MNT="${ROOT_MNT}/boot/efi"

mkdir -p "${ROOT_MNT}"

mount "${LOOPDEV}p2" "${ROOT_MNT}"

mkdir -p "${ROOT_MNT}/boot"
mkdir -p "${ROOT_MNT}/boot/efi"

mount "${LOOPDEV}p1" "${ROOT_MNT}/boot/efi"

# ============================================================
# 14. COPY ROOTFS + GRUB
# ============================================================

echo
echo "[14/14] Installing rootfs and bootloaders..."

rsync -aHAX \
    --numeric-ids \
    --exclude='/proc/***' \
    --exclude='/sys/***' \
    --exclude='/dev/***' \
    --exclude='/run/***' \
    --exclude='/tmp/***' \
    --exclude='/var/tmp/***' \
    --exclude='/var/log/private/***' \
    --exclude='/var/log/gdm3/***' \
    --exclude='/var/log/sssd/***' \
    --exclude='/var/log/chrony/***' \
    --exclude='/var/log/speech-dispatcher/***' \
    --exclude='/var/spool/cups/***' \
    --exclude='/var/spool/rsyslog/***' \
    --exclude='/var/spool/cron/crontabs/***' \
    --exclude='/var/lib/sss/secrets/***' \
    --exclude='/var/lib/udisks2/***' \
    --exclude='/var/lib/ubuntu-advantage/***' \
    --exclude='/var/lib/snapd/void/***' \
    --exclude='/var/lib/update-notifier/package-data-downloads/partial/***' \
    --exclude='/var/lib/systemd/random-seed' \
    "${ROOTFS}/" \
    "${ROOT_MNT}/"

mkdir -p \
    "${ROOT_MNT}/proc" \
    "${ROOT_MNT}/sys" \
    "${ROOT_MNT}/dev" \
    "${ROOT_MNT}/run"

cat > "${ROOT_MNT}/etc/fstab" <<EOF
UUID=${ROOT_UUID} / ext4 defaults,noatime 0 1
UUID=${EFI_UUID} /boot/efi vfat defaults 0 2
EOF

mkdir -p "${ROOT_MNT}/boot/grub"

cat > "${ROOT_MNT}/boot/grub/grub.cfg" <<EOF
set timeout=3
set default=0

search --no-floppy --fs-uuid --set=root ${ROOT_UUID}

menuentry "RCS CyberTrack" {
    linux /boot/vmlinuz-${KVER} root=UUID=${ROOT_UUID} console=tty1 net.ifnames=0 biosdevname=0
    initrd /boot/initrd.img-${KVER}
}
EOF

# UEFI bootloader.
grub-install \
    --target=x86_64-efi \
    --efi-directory="${EFI_MNT}" \
    --boot-directory="${ROOT_MNT}/boot" \
    --bootloader-id=RCS-CyberTrack \
    --removable \
    --no-nvram \
    --recheck

# BIOS bootloader.
grub-install \
    --target=i386-pc \
    --boot-directory="${ROOT_MNT}/boot" \
    --recheck \
    "${LOOPDEV}"

sync

echo
echo "============================================================"
echo " IMAGE VALIDATION"
echo "============================================================"

echo
echo "Partition table:"
sgdisk -v "${IMAGE}"

echo
echo "Filesystem:"
blkid "${LOOPDEV}p1"
blkid "${LOOPDEV}p2"

echo
echo "Root filesystem:"
test -e "${ROOT_MNT}/sbin/init"
test -x "${ROOT_MNT}/usr/lib/systemd/systemd"

echo "OK: /sbin/init"
echo "OK: systemd"

echo
echo "Kernel:"
ls -lh "${ROOT_MNT}/boot/vmlinuz-${KVER}"

echo
echo "Initramfs:"
ls -lh "${ROOT_MNT}/boot/initrd.img-${KVER}"

echo
echo "CyberTrack service:"
grep -E \
    '^(User|Group|ExecStart|NoNewPrivileges|AmbientCapabilities|CapabilityBoundingSet|ProtectSystem|ProtectKernelTunables)' \
    "${ROOT_MNT}/etc/systemd/system/rcscybertrack-core.service"

echo
echo "Service enable:"
readlink "${ROOT_MNT}/etc/systemd/system/multi-user.target.wants/rcscybertrack-core.service"

echo
echo "GRUB:"
cat "${ROOT_MNT}/boot/grub/grub.cfg"

echo
echo "IMAGE SIZE:"
ls -lh "${IMAGE}"

echo
echo "IMAGE SHA256:"
sha256sum "${IMAGE}"

sync

echo
echo "============================================================"
echo " RCS CYBERTRACK V2.1 IMAGE BUILD SUCCESSFUL"
echo "============================================================"
echo
echo "IMAGE:"
echo "${IMAGE}"
echo
echo "USB WAS NOT TOUCHED."
echo
