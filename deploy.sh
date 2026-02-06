#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Load nvm if available (for npm access)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${ROOT_DIR}/terraform"
TFVARS_FILE="${TF_DIR}/terraform.tfvars"

usage() {
  cat <<'EOF'
Usage:
  ./deploy.sh [options]

Deploys the app to the server configured by ./terraform (nginx vhost + optional Cloudflare DNS).

Options:
  --tf-dir PATH         Terraform directory (default: ./terraform)
  --tfvars PATH         Terraform tfvars file (default: ./terraform/terraform.tfvars)
  --ssh-user USER       SSH user (default: root)
  --dry-run             Print actions without executing remote changes
  -h, --help            Show help

Notes:
  - This script prefers `terraform output` for values; it falls back to parsing terraform.tfvars.
  - Requires: terraform (optional but recommended), ssh, rsync, docker on the server.
EOF
}

SSH_USER="root"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tf-dir)
      TF_DIR="$2"
      shift 2
      ;;
    --tfvars)
      TFVARS_FILE="$2"
      shift 2
      ;;
    --ssh-user)
      SSH_USER="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -d "$TF_DIR" ]]; then
  echo "Terraform directory not found: $TF_DIR" >&2
  exit 1
fi

expand_tilde() {
  local p="$1"
  if [[ "$p" == "~/"* ]]; then
    printf '%s\n' "${HOME}/${p:2}"
  else
    printf '%s\n' "$p"
  fi
}

tf_output_raw() {
  local name="$1"
  if command -v terraform >/dev/null 2>&1; then
    terraform -chdir="$TF_DIR" output -raw "$name" 2>/dev/null || true
  else
    true
  fi
}

tfvars_get() {
  local key="$1"
  [[ -f "$TFVARS_FILE" ]] || return 1
  # Extract: key = "value"  or  key = 123  (strip comments)
  local line
  line="$(
    sed -E 's/[[:space:]]*#.*$//' "$TFVARS_FILE" \
      | sed -n -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$/\1/p" \
      | head -n 1
  )"
  [[ -n "$line" ]] || return 1
  # Remove surrounding quotes if present
  line="$(printf '%s' "$line" | sed -E 's/^"(.*)"$/\1/')"
  # Trim whitespace
  line="$(printf '%s' "$line" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  printf '%s\n' "$line"
}

get_value() {
  local tf_out_name="$1"
  local tfvars_key="$2"
  local v
  v="$(tf_output_raw "$tf_out_name")"
  if [[ -n "$v" ]]; then
    printf '%s\n' "$v"
    return 0
  fi
  tfvars_get "$tfvars_key"
}

SERVER_IP="$(get_value server_ip server_ip || true)"
DOMAIN="$(get_value domain domain || true)"
APP_PORT="$(get_value app_port app_port || true)"
APP_NAME="$(tfvars_get app_name || true)"
SSH_KEY_PATH_RAW="$(tfvars_get ssh_private_key_path || true)"

if [[ -z "$APP_NAME" ]]; then
  echo "Missing required value: app_name (expected in $TFVARS_FILE)" >&2
  exit 1
fi
if [[ -z "$SERVER_IP" ]]; then
  echo "Missing required value: server_ip (terraform output or $TFVARS_FILE)" >&2
  exit 1
fi
if [[ -z "$DOMAIN" ]]; then
  echo "Missing required value: domain (terraform output or $TFVARS_FILE)" >&2
  exit 1
fi
if [[ -z "$APP_PORT" ]]; then
  echo "Missing required value: app_port (terraform output or $TFVARS_FILE)" >&2
  exit 1
fi

SSH_KEY_PATH="$(expand_tilde "${SSH_KEY_PATH_RAW:-~/.ssh/id_rsa}")"
if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "SSH key not found: $SSH_KEY_PATH" >&2
  exit 1
fi

REMOTE_HOST="${SSH_USER}@${SERVER_IP}"
REMOTE_BASE="/srv/${APP_NAME}"
REMOTE_COMPOSE="${REMOTE_BASE}/docker-compose.yml"
REMOTE_ENV="${REMOTE_BASE}/.env"

ssh_cmd() {
  ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new "$REMOTE_HOST" "$@"
}

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '[dry-run] %s\n' "$*" >&2
    return 0
  fi
  eval "$@"
}

echo "Deploy target:"
echo "  server_ip:  ${SERVER_IP}"
echo "  domain:     ${DOMAIN}"
echo "  app_name:   ${APP_NAME}"
echo "  app_port:   ${APP_PORT}"
echo "  deploy_dir: ${REMOTE_BASE}"
echo

# Build local packages (submodules) before deploying
echo "Building local packages..."
for pkg_dir in "$ROOT_DIR"/packages/*/; do
  if [[ -f "${pkg_dir}package.json" ]] && grep -q '"build"' "${pkg_dir}package.json" 2>/dev/null; then
    pkg_name="$(basename "$pkg_dir")"
    echo "  Building $pkg_name..."
    npm run build --silent --prefix "$pkg_dir" || {
      echo "Failed to build $pkg_name" >&2
      exit 1
    }
  fi
done
echo

echo "Syncing code to ${REMOTE_HOST}:${REMOTE_BASE} ..."
run "ssh_cmd \"mkdir -p '$REMOTE_BASE'\""

# Sync the repository to the remote folder (build happens on the server).
run "rsync -az --delete \
  -e \"ssh -i '$SSH_KEY_PATH' -o StrictHostKeyChecking=accept-new\" \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'terraform/' \
  --exclude '.terraform/' \
  --exclude '*.tfstate*' \
  --exclude 'docs/' \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude '.env.local' \
  \"$ROOT_DIR/\" \"$REMOTE_HOST:$REMOTE_BASE/\""

# Create .env template only if it doesn't exist (to avoid overwriting secrets)
if [[ "$DRY_RUN" == "true" ]]; then
  echo "[dry-run] Would create ${REMOTE_ENV} if it doesn't exist"
else
  ssh_cmd "test -f '$REMOTE_ENV' || cat > '$REMOTE_ENV'" <<EOF
APP_NAME=${APP_NAME}
APP_PORT=${APP_PORT}
POSTGRES_DB=${APP_NAME}
POSTGRES_USER=${APP_NAME}
# Set these on the server (do not commit secrets):
# POSTGRES_PASSWORD=
# DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}
# BETTER_AUTH_SECRET=
# BETTER_AUTH_URL=https://${DOMAIN}
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
EOF
  echo "Checked ${REMOTE_ENV} (created if missing)"
fi

echo "Building + starting container on server (docker compose up -d --build) ..."
run "ssh_cmd \"cd '$REMOTE_BASE' && docker compose up -d --build\""

echo "Running database migrations ..."
run "ssh_cmd \"cd '$REMOTE_BASE' && docker compose exec -T web npm run db:migrate\""

echo
echo "Done."
echo "URL: http://${DOMAIN}"

