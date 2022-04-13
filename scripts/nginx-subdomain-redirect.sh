#!/bin/bash

## how to use:
## download
# wget https://raw.githubusercontent.com/openoms/galoy/self-hosting/scripts/nginx-subdomain-redirect.sh -O nginx-subdomain-redirect.sh
## run
# bash nginx-subdomain-redirect.sh

echo "
Input your email (used for notifications about the SSL certificate):
"
read EMAIL

echo "
Input a subdomain set up with an A record pointing to this server:
eg.: api.testnet.diynodes.com
"
read SUBDOMAIN

echo "
Input the URL:PORT to be redirected to (can be local, over the LAN or VPN):
eg.: https://192.168.1.42:4012
"
read REDIRECT

sudo certbot certonly -a standalone -m $EMAIL --agree-tos \
-d $SUBDOMAIN --expand -n --pre-hook "service nginx stop" \
--post-hook "service nginx start" || exit 1

## add to /etc/nginx/sites-available/
echo "\
# galoy-api_subdomain.conf

server {
  listen 443 ssl;
  server_name $SUBDOMAIN;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;

  ssl_ciphers 'TLS13+AESGCM+AES128:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';

  ssl_session_cache shared:SSL:50m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  ssl_ecdh_curve X25519:sect571r1:secp521r1:secp384r1;

  ## add HSTS header with a value of 365 days
  add_header Strict-Transport-Security 'max-age=31536000';

  ssl_certificate /etc/letsencrypt/live/$SUBDOMAIN/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/$SUBDOMAIN/privkey.pem;

  ssl_stapling on;
  ssl_stapling_verify on;
  ssl_trusted_certificate /etc/letsencrypt/live/$SUBDOMAIN/chain.pem;

  access_log /var/log/nginx/access_galoy-$SUBDOMAIN.log;
  error_log /var/log/nginx/error_galoy-$SUBDOMAIN.log;

  location / {
    proxy_pass $REDIRECT;

    ## for websocket
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'Upgrade';

    proxy_redirect off;
    proxy_set_header Host \$http_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}" | sudo tee /etc/nginx/sites-available/$SUBDOMAIN

## add to /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/$SUBDOMAIN /etc/nginx/sites-enabled/

sudo nginx -t || exit 1

sudo systemctl restart nginx
