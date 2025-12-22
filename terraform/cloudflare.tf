# Cloudflare DNS configuration (optional)
# Set enable_cloudflare_dns = false in terraform.tfvars to skip

data "cloudflare_zone" "main" {
  count = var.enable_cloudflare_dns ? 1 : 0
  name  = local.cloudflare_zone
}

resource "cloudflare_record" "app" {
  count   = var.enable_cloudflare_dns ? 1 : 0
  zone_id = data.cloudflare_zone.main[0].id
  name    = local.subdomain
  content = var.server_ip
  type    = "A"
  ttl     = var.cloudflare_proxy_enabled ? 1 : 300
  proxied = var.cloudflare_proxy_enabled

  comment = "${var.app_name} application"
}
