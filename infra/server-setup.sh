#!/usr/bin/env bash
# Idempotent bootstrap for the basti Hetzner server.
# Safe to re-run. Skips already-installed components.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash $0" >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-elmelegy}"
REPO_DIR="/home/${TARGET_USER}/basti/backend-basti-service"

echo "==> Target user: ${TARGET_USER}"
echo "==> Backend repo expected at: ${REPO_DIR}"

# ---------- 1. UFW (host firewall, behind Hetzner Cloud Firewall) ----------
echo "==> UFW"
if ! command -v ufw >/dev/null; then
  apt-get update -y
  apt-get install -y ufw
fi
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# ---------- 2. fail2ban ----------
echo "==> fail2ban"
if ! command -v fail2ban-client >/dev/null; then
  apt-get install -y fail2ban
fi
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 3
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban

# ---------- 3. Swap (4 GB) ----------
echo "==> Swap"
if ! swapon --show | grep -q swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=10 >/dev/null
grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

# ---------- 4. Docker ----------
echo "==> Docker"
if ! command -v docker >/dev/null; then
  apt-get install -y ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker present: $(docker --version)"
fi
usermod -aG docker "${TARGET_USER}"

# Log rotation so docker logs don't fill the disk
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
systemctl restart docker

# ---------- 5. Caddy (skip if already installed) ----------
echo "==> Caddy"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
else
  echo "Caddy present: $(caddy version)"
fi

# ---------- 6. Sync Caddy config from repo into /etc/caddy/ ----------
# We copy (not symlink) because the caddy user can't traverse into /home/elmelegy/
# (home dirs are 750 by default). /etc/caddy/ is root-owned + world-readable, so caddy
# can read freely. Re-run this script to refresh /etc/caddy/ when config changes.
echo "==> Caddy config sync"
REPO_CADDY_DIR="${REPO_DIR}/infra/caddy"
if [[ -d "${REPO_CADDY_DIR}" ]]; then
  # One-time backup of original default Caddyfile
  if [[ -f /etc/caddy/Caddyfile && ! -L /etc/caddy/Caddyfile && ! -f /etc/caddy/Caddyfile.orig ]]; then
    cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.orig
  fi
  # Remove any old symlink
  [[ -L /etc/caddy/Caddyfile ]] && rm -f /etc/caddy/Caddyfile
  # Copy in fresh config
  cp "${REPO_CADDY_DIR}/Caddyfile" /etc/caddy/Caddyfile
  mkdir -p /etc/caddy/sites /etc/caddy/snippets
  cp -f "${REPO_CADDY_DIR}/sites/"*.caddy /etc/caddy/sites/
  cp -f "${REPO_CADDY_DIR}/snippets/"*.caddy /etc/caddy/snippets/
  chown -R root:caddy /etc/caddy/Caddyfile /etc/caddy/sites /etc/caddy/snippets
  chmod 0644 /etc/caddy/Caddyfile /etc/caddy/sites/*.caddy /etc/caddy/snippets/*.caddy
  # Validate before reload
  if caddy validate --config /etc/caddy/Caddyfile; then
    systemctl reload caddy 2>/dev/null || systemctl restart caddy
    echo "Caddy reloaded."
  else
    echo "ERROR: Caddyfile validation failed; not reloading caddy."
    exit 1
  fi
else
  echo "WARN: ${REPO_CADDY_DIR} not found yet — clone the backend repo and re-run this script"
fi

# ---------- 7. Static dashboard dir ----------
echo "==> /var/www/dashboard"
mkdir -p /var/www/dashboard
chown -R "${TARGET_USER}":caddy /var/www/dashboard
chmod 755 /var/www/dashboard

# ---------- 8. Caddy logs ----------
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# ---------- 9. Passwordless sudo for reloading Caddy from deploys ----------
echo "==> sudoers for Caddy reload"
cat > /etc/sudoers.d/${TARGET_USER}-caddy <<EOF
${TARGET_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload caddy, /usr/bin/systemctl restart caddy
EOF
chmod 0440 /etc/sudoers.d/${TARGET_USER}-caddy

echo "==> Bootstrap complete."
echo "Next:"
echo "  1. As ${TARGET_USER}, clone the dashboard repo into ~/basti/"
echo "  2. Trigger GitHub Actions deploys (workflow_dispatch) for backend then dashboard"
echo "  3. Once https://api.basty.ly/api/health returns ok, set Cloudflare SSL to 'Full (strict)'"
