# ${domain} virtual host configuration (HTTPS)
#
# This config is compatible with:
# - Cloudflare proxy ON (Full / Full (strict)): Cloudflare connects to origin over HTTPS.
# - Cloudflare proxy OFF: users connect directly over HTTPS.
#
# Requires a Let's Encrypt cert at:
#   /etc/letsencrypt/live/${domain}/fullchain.pem
#   /etc/letsencrypt/live/${domain}/privkey.pem

# HTTP server (ACME + redirect)
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Allow Let's Encrypt HTTP-01 challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;

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
