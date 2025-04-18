import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Recommended Nginx config with extended timeouts for embedding API
const RECOMMENDED_NGINX_CONFIG = `
server {
    listen 80;
    server_name search.getcrazywisdom.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name search.getcrazywisdom.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/search.getcrazywisdom.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/search.getcrazywisdom.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Logging
    access_log /var/log/nginx/search.getcrazywisdom.com.access.log;
    error_log /var/log/nginx/search.getcrazywisdom.com.error.log;

    # Increased timeouts for long-running API requests
    proxy_connect_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increased buffer size for large request bodies
        proxy_request_buffering on;
        client_max_body_size 10M;
        client_body_buffer_size 128k;
    }
    
    # Special handling for embedding API with longer timeouts
    location /api/embed {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Extended timeout for embedding processing
        proxy_connect_timeout 600s;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        
        # Increased buffer size for large request bodies
        proxy_request_buffering on;
        client_max_body_size 10M;
        client_body_buffer_size 128k;
    }
}
`;

export async function GET(request: Request) {
  try {
    // Get Nginx configuration
    let nginxConfig = {};
    try {
      // Get Nginx sites
      const { stdout: sites } = await execAsync('ls -la /etc/nginx/sites-enabled/');
      
      // Get specific site configuration
      const { stdout: siteConfig } = await execAsync('cat /etc/nginx/sites-enabled/search.getcrazywisdom.com || echo "File not found"');
      
      // Get Nginx status
      const { stdout: status } = await execAsync('systemctl status nginx | head -n 20');
      
      // Get Nginx version
      const { stdout: version } = await execAsync('nginx -v 2>&1');
      
      nginxConfig = {
        sites: sites,
        searchSiteConfig: siteConfig,
        status: status,
        version: version.trim(),
      };
    } catch (error) {
      nginxConfig = { error: 'Failed to get Nginx configuration', details: error };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      nginx: nginxConfig,
      request: {
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
      recommendedConfig: {
        description: "Recommended Nginx configuration with extended timeouts for embedding API",
        note: "This configuration includes 600s timeouts for the /api/embed endpoint to prevent 504 Gateway Timeout errors",
        config: RECOMMENDED_NGINX_CONFIG,
        installInstructions: "Save this config to /etc/nginx/sites-enabled/search.getcrazywisdom.com and run 'sudo nginx -t' to test, then 'sudo systemctl restart nginx' to apply"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get Nginx information', details: error },
      { status: 500 }
    );
  }
}