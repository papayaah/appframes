# Outputs

output "server_ip" {
  description = "Server IP address"
  value       = var.server_ip
}

output "domain" {
  description = "Full domain name"
  value       = var.domain
}

output "app_port" {
  description = "Internal port for the app"
  value       = var.app_port
}

output "deploy_path" {
  description = "Path on server where app is deployed"
  value       = "/srv/${var.app_name}"
}

output "dns_record_id" {
  description = "Cloudflare DNS record ID"
  value       = var.enable_cloudflare_dns ? cloudflare_record.app[0].id : null
}

output "url" {
  description = "Application URL"
  value       = "http://${var.domain}"
}
