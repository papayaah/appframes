# ${domain} bootstrap virtual host configuration (HTTP only)
#
# Purpose:
# - Serve the app over HTTP temporarily
# - Allow Let's Encrypt HTTP-01 validation via /.well-known/acme-challenge/
#
# After a cert is issued, Terraform replaces this file with nginx-vhost.conf.tpl (HTTPS).

server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Allow Let's Encrypt HTTP-01 challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to Docker container
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:${port}/health;
        proxy_http_version 1.1;
        access_log off;
    }
}


