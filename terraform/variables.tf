# Variables for App Terraform configuration
# Server is assumed to already be provisioned (by another app's cloud-init)

variable "server_ip" {
  description = "IP address of the target server"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key for server access"
  type        = string
  default     = "~/.ssh/id_rsa"
}

variable "domain" {
  description = "Full domain name for the service, e.g., 'myapp.example.com'"
  type        = string
}

variable "app_name" {
  description = "Name of the app (used for nginx config filename and directory)"
  type        = string
}

variable "app_port" {
  description = "Internal port the app listens on (Docker exposes to 127.0.0.1:port)"
  type        = number
}

# Cloudflare settings (optional)
variable "enable_cloudflare_dns" {
  description = "Whether to create Cloudflare DNS record"
  type        = bool
  default     = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_proxy_enabled" {
  description = "Whether to proxy traffic through Cloudflare"
  type        = bool
  default     = true
}

# Computed values
locals {
  domain_parts    = split(".", var.domain)
  cloudflare_zone = join(".", slice(local.domain_parts, length(local.domain_parts) - 2, length(local.domain_parts)))
  subdomain       = join(".", slice(local.domain_parts, 0, length(local.domain_parts) - 2))
}
