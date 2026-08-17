# RCS CyberTrack — Production Deployment Guide (v0.6.0)

This document provides complete instructions for installing, configuring, deploying, hardening, monitoring, backing up, restoring, and rolling back the RCS CyberTrack Core Management Appliance in production environments.

---

## 1. Prerequisites

- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS / 26.04 LTS (Linux kernel >= 5.15)
- **Kernel Utilities**: `nftables` (v1.0.0+), `systemd` (v245+), `python3` (v3.12+)
- **System Service Account**: User `rcscybertrack`, group `rcscybertrack`
- **Reverse Proxy**: Nginx / Caddy / Traefik with TLS certificate (Certbot / Let's Encrypt)
- **Production Domain**: `https://console.rcscybertrack.in`

---

## 2. Directory Layout & Permissions

Production installation uses the standard Linux directory layout:

| Path | Purpose | Permissions | Owner |
| :--- | :--- | :--- | :--- |
| `/usr/share/rcscybertrack` | Application root & virtual environment | `0755` | `root:root` |
| `/usr/share/rcscybertrack/gui/dist` | Built React web console assets | `0755` | `root:root` |
| `/etc/rcscybertrack` | Configuration directory (`rcscybertrack.yaml`, `.env`) | `0755` | `root:root` |
| `/var/log/rcscybertrack` | Audit logs & application logs | `0755` | `rcscybertrack:rcscybertrack` |
| `/etc/systemd/system` | Service unit (`rcscybertrack-core.service`) | `0644` | `root:root` |

---

## 3. Environment Variables & Production Secrets

Create `/etc/rcscybertrack/.env` with strict permissions (`chmod 600`):

```bash
# --- Environment Mode ---
CYBERTRACK_ENV=production

# --- Database ---
CYBERTRACK_DATABASE_URL=sqlite:////usr/share/rcscybertrack/data/cybertrack.db

# --- Cryptographic JWT Security ---
# Generate via: openssl rand -hex 32
CYBERTRACK_JWT_SECRET=8f9a2b4c6e8d0f1a3b5c7e9f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b
CYBERTRACK_JWT_ISSUER=rcs-cybertrack-api
CYBERTRACK_JWT_AUDIENCE=rcs-cybertrack-client
CYBERTRACK_TOKEN_EXPIRE_MINUTES=60

# --- Server & CORS ---
CYBERTRACK_HOST=127.0.0.1
CYBERTRACK_PORT=8000
CYBERTRACK_LOG_LEVEL=INFO
CYBERTRACK_FIREWALL_BACKEND=nftables
CYBERTRACK_CORS_ORIGINS=https://console.rcscybertrack.in
CYBERTRACK_HSTS_ENABLED=true

# --- Bootstrap Administration ---
CYBERTRACK_BOOTSTRAP_ENABLED=false
```

---

## 4. Reverse Proxy & TLS Gateway Architecture

### Topology Overview
```text
Client Browser (HTTPS) ---> Nginx Reverse Proxy (Port 443, TLS Termination)
                                  |
                                  +---> /          -> Serve static files (/usr/share/rcscybertrack/gui/dist)
                                  +---> /api/v1/   -> Proxy to FastAPI (127.0.0.1:8000)
```

### Nginx Example Configuration (`/etc/nginx/sites-available/rcscybertrack.conf`)
```nginx
server {
    listen 80;
    server_name console.rcscybertrack.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name console.rcscybertrack.in;

    ssl_certificate /etc/letsencrypt/live/console.rcscybertrack.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/console.rcscybertrack.in/privkey.pem;

    # Static Web Console
    location / {
        root /usr/share/rcscybertrack/gui/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## 5. Systemd Service Management

Install and start the management service:

```bash
# Copy systemd service file
cp os/services/rcscybertrack-core.service /etc/systemd/system/

# Reload systemd and start service
systemctl daemon-reload
systemctl enable --now rcscybertrack-core.service

# Check service status
systemctl status rcscybertrack-core.service
```

---

## 6. Backup & Restore Procedures

### Production Backup Command
```bash
# Create timestamped backup archive
tar -czvf /var/backups/rcscybertrack-backup-$(date +%Y%m%d_%H%M%S).tar.gz \
    /etc/rcscybertrack \
    /usr/share/rcscybertrack/data \
    /usr/share/rcscybertrack/firewall/rules \
    /var/log/rcscybertrack
```

### Production Restore Command
```bash
# Stop service before restoring
systemctl stop rcscybertrack-core.service

# Extract backup archive
tar -xzvf /var/backups/rcscybertrack-backup-YYYYMMDD_HHMMSS.tar.gz -C /

# Restart service
systemctl start rcscybertrack-core.service
```

---

## 7. Rollback Procedure (v0.6.0 to v0.5.1)

If a emergency rollback from v0.6.0 to v0.5.1 is required:

```bash
# 1. Checkout v0.5.1 release tag
git checkout tags/v0.5.1

# 2. Rebuild frontend & verify backend
cd gui && npm run build && cd ..
.venv/bin/python -m pytest -q

# 3. Restart management service
systemctl restart rcscybertrack-core.service
```

---

## 8. Smoke Testing

Run the automated smoke test script against local daemon:

```bash
python3 os/scripts/smoke_test.py --url http://127.0.0.1:8000
```
