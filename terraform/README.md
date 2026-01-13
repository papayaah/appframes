# App Terraform Configuration

This Terraform configuration adds a new app to an **existing server** that was already provisioned with Docker and Nginx.

## What This Does

1. **Nginx Virtual Host** - Creates nginx config for your domain
2. **Cloudflare DNS** (optional) - Creates A record pointing to the server
3. **App Directory** - Creates `/srv/{app_name}` on the server

## Prerequisites

1. **Server already provisioned** - Docker, Nginx, firewall must be installed

2. **Terraform** - Install from https://terraform.io
   ```bash
   brew install terraform
   ```

3. **SSH Access** - Ensure you can SSH to the server

## Quick Start

```bash
cd terraform

# 1. Create your variables file
cp terraform.tfvars.example terraform.tfvars

# 2. Edit terraform.tfvars with your values

# 3. Initialize and apply
terraform init
terraform plan
terraform apply

# 4. Deploy your app
cd ..
./deploy.sh
```

## Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `server_ip` | Server IP address | Yes |
| `domain` | Full domain (e.g., `myapp.example.com`) | Yes |
| `app_name` | App name (used for nginx config and directory) | Yes |
| `app_port` | Internal port Docker exposes to `127.0.0.1` | Yes |
| `enable_cloudflare_dns` | Create DNS record | No (default: `true`) |
| `cloudflare_api_token` | Cloudflare API token | If using Cloudflare |

## What `./deploy.sh` Does

- **Syncs** this repo to `/srv/{app_name}/app` on the server (via `rsync` over SSH)
- **Uploads** the repo’s `docker-compose.yml` to `/srv/{app_name}/docker-compose.yml` (binding `127.0.0.1:{app_port} -> 3000`)
- **Writes** `/srv/{app_name}/.env` with `APP_NAME` + `APP_PORT` (and optional Postgres env vars; Postgres is not exposed to the host by default)
- **Builds + starts** the app via `docker compose up -d --build`

## Port Allocation

Each app on the server should use a unique port:

| App | Port |
|-----|------|
| app1 | 9001 |
| app2 | 9002 |
| app3 | 9003 |

## Adding to Existing Server

This terraform is designed to **add** to an existing server, not provision from scratch.

If the server isn't set up yet, you need to install Docker, Nginx, and configure the firewall first.
