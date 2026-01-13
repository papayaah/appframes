# Nginx virtual host configuration
# Note: Server is assumed to already be provisioned with nginx installed
# (e.g., by running cloud-init from another app like perfmon)

resource "null_resource" "nginx_vhost" {
  triggers = {
    template_hash           = filemd5("${path.module}/templates/nginx-vhost.conf.tpl")
    bootstrap_template_hash = filemd5("${path.module}/templates/nginx-vhost-bootstrap.conf.tpl")
    domain                  = var.domain
    port                    = var.app_port
  }

  connection {
    type        = "ssh"
    host        = var.server_ip
    user        = "root"
    private_key = file(var.ssh_private_key_path)
    timeout     = "2m"
  }

  # 1) Bootstrap HTTP-only vhost (so cert issuance can succeed)
  provisioner "file" {
    content = templatefile("${path.module}/templates/nginx-vhost-bootstrap.conf.tpl", {
      domain = var.domain
      port   = var.app_port
    })
    destination = "/etc/nginx/sites-available/${var.app_name}.conf"
  }

  # Enable site and reload nginx (HTTP-only), then obtain cert, then switch to HTTPS config.
  provisioner "remote-exec" {
    inline = [
      "ln -sf /etc/nginx/sites-available/${var.app_name}.conf /etc/nginx/sites-enabled/${var.app_name}.conf",
      "nginx -t",
      "systemctl reload nginx",
      "mkdir -p /var/www/html",
      "which certbot > /dev/null 2>&1 || (apt-get update && apt-get install -y certbot)",
      # Issue/renew cert (webroot HTTP-01)
      # IMPORTANT: This only succeeds if ${var.domain} resolves to this server (and port 80 is reachable).
      # We do not fail the whole apply if cert issuance fails; we keep the HTTP vhost in place.
      "certbot certonly --webroot -w /var/www/html -d ${var.domain} --non-interactive --agree-tos --email admin@${var.domain} --keep-until-expiring || echo 'WARN: certbot failed (DNS/port80/proxy). Keeping HTTP vhost. Fix DNS/proxy then re-run terraform apply.'"
    ]
  }

  # 2) Stage final HTTPS vhost config; we only activate it if cert files exist.
  provisioner "file" {
    content = templatefile("${path.module}/templates/nginx-vhost.conf.tpl", {
      domain = var.domain
      port   = var.app_port
    })
    destination = "/etc/nginx/sites-available/${var.app_name}.conf.next"
  }

  provisioner "remote-exec" {
    inline = [
      "if [ -f '/etc/letsencrypt/live/${var.domain}/fullchain.pem' ] && [ -f '/etc/letsencrypt/live/${var.domain}/privkey.pem' ]; then mv -f '/etc/nginx/sites-available/${var.app_name}.conf.next' '/etc/nginx/sites-available/${var.app_name}.conf' && nginx -t && systemctl reload nginx && echo 'Nginx HTTPS vhost configured for ${var.domain}'; else rm -f '/etc/nginx/sites-available/${var.app_name}.conf.next' && echo 'WARN: SSL cert not present yet; staying on HTTP until cert is issued.'; fi",
    ]
  }
}

# Create app directory on server
resource "null_resource" "app_directory" {
  connection {
    type        = "ssh"
    host        = var.server_ip
    user        = "root"
    private_key = file(var.ssh_private_key_path)
    timeout     = "2m"
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /srv/${var.app_name}",
      "echo 'App directory created at /srv/${var.app_name}'"
    ]
  }
}
