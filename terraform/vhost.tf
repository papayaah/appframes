# Nginx virtual host configuration
# Note: Server is assumed to already be provisioned with nginx installed
# (e.g., by running cloud-init from another app like perfmon)

resource "null_resource" "nginx_vhost" {
  triggers = {
    template_hash = filemd5("${path.module}/templates/nginx-vhost.conf.tpl")
    domain        = var.domain
    port          = var.app_port
  }

  connection {
    type        = "ssh"
    host        = var.server_ip
    user        = "root"
    private_key = file(var.ssh_private_key_path)
    timeout     = "2m"
  }

  # Copy rendered nginx vhost configuration
  provisioner "file" {
    content = templatefile("${path.module}/templates/nginx-vhost.conf.tpl", {
      domain = var.domain
      port   = var.app_port
    })
    destination = "/etc/nginx/sites-available/${var.app_name}.conf"
  }

  # Enable site and reload nginx
  provisioner "remote-exec" {
    inline = [
      "ln -sf /etc/nginx/sites-available/${var.app_name}.conf /etc/nginx/sites-enabled/${var.app_name}.conf",
      "nginx -t",
      "systemctl reload nginx",
      "echo 'Nginx vhost configured for ${var.domain}'"
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
