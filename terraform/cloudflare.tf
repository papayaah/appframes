# Cloudflare DNS configuration (optional)
# Set enable_cloudflare_dns = false in terraform.tfvars to skip

data "cloudflare_zone" "main" {
  count = var.enable_cloudflare_dns && var.cloudflare_zone_id == "" ? 1 : 0
  name  = local.cloudflare_zone
}

locals {
  cloudflare_zone_id = var.cloudflare_zone_id != "" ? var.cloudflare_zone_id : (var.enable_cloudflare_dns ? data.cloudflare_zone.main[0].id : "")
}

resource "cloudflare_record" "app" {
  count           = var.enable_cloudflare_dns ? 1 : 0
  zone_id         = local.cloudflare_zone_id
  name            = local.record_name
  content         = var.server_ip
  type            = "A"
  ttl             = var.cloudflare_proxy_enabled ? 1 : 300
  proxied         = var.cloudflare_proxy_enabled
  allow_overwrite = true

  comment = "${var.app_name} application"
}
