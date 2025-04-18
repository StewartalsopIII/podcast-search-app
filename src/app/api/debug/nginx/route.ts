import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get Nginx information', details: error },
      { status: 500 }
    );
  }
}