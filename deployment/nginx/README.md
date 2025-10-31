# Nginx Configuration for NetADX AI-CORE

This directory contains nginx reverse proxy configurations for the NetADX AI-CORE MCP API server.

## Available Configurations

### 1. Production Configuration (`netadx-aicore.conf`)

Full-featured production configuration with:
- ✅ SSL/TLS (HTTPS)
- ✅ HTTP/2 support
- ✅ CORS headers
- ✅ Rate limiting
- ✅ Security headers
- ✅ Gzip compression
- ✅ Load balancing support
- ✅ Access/Error logging

**Use for:** Production deployments with SSL certificates

### 2. Simple Configuration (`netadx-aicore-simple.conf`)

Lightweight development/staging configuration with:
- ✅ Basic reverse proxy
- ✅ CORS headers (wildcard origin)
- ✅ Simple logging
- ✅ No SSL (HTTP only)

**Use for:** Development, staging, or internal networks

## Quick Setup

### Option 1: Production (with SSL)

```bash
# 1. Install nginx
sudo apt install nginx  # Ubuntu/Debian
# or
sudo yum install nginx  # CentOS/RHEL

# 2. Copy configuration
sudo cp netadx-aicore.conf /etc/nginx/sites-available/netadx-aicore

# 3. Update configuration
sudo nano /etc/nginx/sites-available/netadx-aicore
# Change:
#   - server_name to your domain
#   - ssl_certificate paths to your SSL cert paths
#   - upstream servers if needed

# 4. Obtain SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.netadx.ai

# 5. Enable site
sudo ln -s /etc/nginx/sites-available/netadx-aicore /etc/nginx/sites-enabled/

# 6. Test configuration
sudo nginx -t

# 7. Reload nginx
sudo systemctl reload nginx
```

### Option 2: Development (no SSL)

```bash
# 1. Copy simple configuration
sudo cp netadx-aicore-simple.conf /etc/nginx/sites-available/netadx-aicore

# 2. Update server_name if needed
sudo nano /etc/nginx/sites-available/netadx-aicore

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/netadx-aicore /etc/nginx/sites-enabled/

# 4. Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Configuration Details

### Upstream Backend

By default, nginx proxies to `127.0.0.1:8005` (the Node.js MCP API server).

**Single server:**
```nginx
upstream netadx_aicore_backend {
    server 127.0.0.1:8005;
}
```

**Multiple servers (load balancing):**
```nginx
upstream netadx_aicore_backend {
    least_conn;  # Load balancing method
    server 127.0.0.1:8005 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8006 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8007 max_fails=3 fail_timeout=30s;
}
```

### CORS Configuration

**Production (restricted origins):**
```nginx
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
```
This allows requests from the actual origin that made the request (reflected CORS).

**Development (allow all):**
```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
```
This allows requests from any origin (useful for development).

**Specific origins:**
```nginx
# Add to server block
set $cors_origin "";
if ($http_origin ~* (https?://app\.netadx\.ai|https?://localhost:3000)) {
    set $cors_origin $http_origin;
}

# In location block
add_header 'Access-Control-Allow-Origin' $cors_origin always;
```

### Rate Limiting

Production configuration includes rate limiting:

```nginx
# API endpoints: 100 requests/second per IP
limit_req zone=api_limit burst=20 nodelay;

# Auth endpoints: 10 requests/second per IP
limit_req zone=auth_limit burst=5 nodelay;
```

**Adjust rate limits:**
```nginx
# In http block
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;  # Change 100r/s

# In location block
limit_req zone=api_limit burst=20 nodelay;  # Change burst value
```

### SSL/TLS Configuration

**Let's Encrypt (recommended):**
```bash
sudo certbot --nginx -d api.netadx.ai
```

**Manual certificate:**
```nginx
ssl_certificate /path/to/fullchain.pem;
ssl_certificate_key /path/to/privkey.pem;
```

**Self-signed (development only):**
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/netadx-selfsigned.key \
  -out /etc/ssl/certs/netadx-selfsigned.crt
```

## Testing

### Test Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Test CORS

```bash
# Test preflight OPTIONS request
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v http://api.netadx.ai/

# Expected headers in response:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
# Access-Control-Allow-Headers: ...
```

### Test API

```bash
# Test health endpoint
curl http://api.netadx.ai/health

# Test API endpoint with CORS
curl -H "Origin: http://localhost:3000" \
     -H "x-access-token: YOUR_JWT_TOKEN" \
     -v http://api.netadx.ai/tools
```

## Monitoring

### View Access Logs

```bash
# Real-time access log
sudo tail -f /var/log/nginx/netadx-aicore-access.log

# Real-time error log
sudo tail -f /var/log/nginx/netadx-aicore-error.log

# Search for errors
sudo grep "error" /var/log/nginx/netadx-aicore-error.log
```

### Nginx Status

```bash
# Check nginx status
sudo systemctl status nginx

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Backend server not running or unreachable

**Solution:**
```bash
# Check if Node.js server is running
pm2 status

# Check if port 8005 is listening
sudo netstat -tlnp | grep 8005

# Start backend if not running
pm2 start ecosystem.config.js
```

### Issue: CORS errors in browser

**Cause:** Missing or incorrect CORS headers

**Solution:**
1. Check nginx configuration includes CORS headers
2. Verify `Access-Control-Allow-Origin` header in response:
   ```bash
   curl -H "Origin: http://localhost:3000" -v http://api.netadx.ai/health
   ```
3. Ensure preflight OPTIONS requests are handled

### Issue: Rate limit exceeded

**Cause:** Too many requests from single IP

**Solution:**
```bash
# Check nginx error log
sudo grep "limiting requests" /var/log/nginx/netadx-aicore-error.log

# Adjust rate limits in nginx config
# Reload nginx after changes
sudo nginx -t && sudo systemctl reload nginx
```

### Issue: SSL certificate errors

**Cause:** Expired or invalid certificate

**Solution:**
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Auto-renewal (Let's Encrypt)
sudo systemctl status certbot.timer
```

## Security Best Practices

1. **Always use HTTPS in production**
   - Obtain free SSL certificates from Let's Encrypt
   - Enable HTTP/2 for better performance

2. **Restrict CORS origins**
   - Never use `Access-Control-Allow-Origin: *` in production
   - List specific allowed origins

3. **Enable rate limiting**
   - Protect against DDoS and brute force attacks
   - Set appropriate limits for your use case

4. **Keep nginx updated**
   ```bash
   sudo apt update && sudo apt upgrade nginx
   ```

5. **Monitor logs regularly**
   - Set up log rotation
   - Use log analysis tools (fail2ban, etc.)

6. **Hide server version**
   ```nginx
   # In http block
   server_tokens off;
   ```

## Log Rotation

Create `/etc/logrotate.d/netadx-aicore`:

```
/var/log/nginx/netadx-aicore-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## Performance Tuning

### Worker Processes

```nginx
# In nginx.conf
worker_processes auto;  # Use number of CPU cores
worker_connections 1024;
```

### Caching (optional)

```nginx
# In http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# In location block
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_key "$scheme$request_method$host$request_uri";
```

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [CORS Configuration](https://enable-cors.org/server_nginx.html)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Maintained by:** NetADX AI-CORE Team
