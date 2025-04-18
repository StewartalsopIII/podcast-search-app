import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    // Get server OS information
    const osInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024)) + 'MB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024)) + 'MB',
      uptime: Math.round(os.uptime() / 3600) + ' hours',
    };

    // Get Docker information
    let dockerInfo = {};
    try {
      const { stdout: dockerVersion } = await execAsync('docker --version');
      const { stdout: dockerContainers } = await execAsync('docker ps');
      dockerInfo = {
        version: dockerVersion.trim(),
        containers: dockerContainers.split('\\n').length - 1,
        containerList: dockerContainers,
      };
    } catch (error) {
      dockerInfo = { error: 'Docker command failed or not available' };
    }

    // Get Node/NPM information
    let nodeInfo = {};
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      const { stdout: npmVersion } = await execAsync('npm --version');
      nodeInfo = {
        nodeVersion: nodeVersion.trim(),
        npmVersion: npmVersion.trim(),
      };
    } catch (error) {
      nodeInfo = { error: 'Node/NPM command failed or not available' };
    }

    // Get Nginx information
    let nginxInfo = {};
    try {
      const { stdout: nginxVersion } = await execAsync('nginx -v 2>&1');
      const { stdout: nginxStatus } = await execAsync('systemctl status nginx | grep Active');
      const { stdout: nginxConfig } = await execAsync('ls -la /etc/nginx/sites-enabled/');
      
      nginxInfo = {
        version: nginxVersion.trim(),
        status: nginxStatus.trim(),
        configFiles: nginxConfig,
      };
    } catch (error) {
      nginxInfo = { error: 'Nginx command failed or not available' };
    }

    // Get disk space information
    let diskInfo = {};
    try {
      const { stdout: diskSpace } = await execAsync('df -h');
      diskInfo = {
        diskSpace: diskSpace,
      };
    } catch (error) {
      diskInfo = { error: 'Disk space command failed' };
    }

    // Network interfaces
    const networkInterfaces = os.networkInterfaces();
    const filteredNetworkInterfaces = Object.entries(networkInterfaces).reduce(
      (acc, [name, interfaces]) => {
        if (interfaces) {
          acc[name] = interfaces.map(iface => ({
            address: iface.address,
            family: iface.family,
            internal: iface.internal,
          }));
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Environment variables (filtered)
    const filteredEnv = Object.entries(process.env).reduce((acc, [key, value]) => {
      if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD')) {
        acc[key] = value;
      } else {
        acc[key] = '[FILTERED]';
      }
      return acc;
    }, {} as Record<string, string | undefined>);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      os: osInfo,
      node: nodeInfo,
      docker: dockerInfo,
      nginx: nginxInfo,
      disk: diskInfo,
      network: filteredNetworkInterfaces,
      environment: filteredEnv,
      request: {
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get server information', details: error },
      { status: 500 }
    );
  }
}