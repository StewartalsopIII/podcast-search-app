import { NextResponse } from 'next/server';
import * as os from 'os';

export async function GET(request: Request) {
  // Get request information
  const requestInfo = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };

  // Get environment variables (filtering out sensitive ones)
  const filteredEnv = Object.entries(process.env).reduce((acc, [key, value]) => {
    // Filter out sensitive keys
    if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD')) {
      acc[key] = value;
    } else {
      acc[key] = '[FILTERED]';
    }
    return acc;
  }, {} as Record<string, string | undefined>);

  // Get server information
  const serverInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    cpus: os.cpus().length,
    memory: {
      total: Math.round(os.totalmem() / (1024 * 1024)),
      free: Math.round(os.freemem() / (1024 * 1024)),
    },
    network: Object.entries(os.networkInterfaces()).reduce((acc, [name, interfaces]) => {
      if (interfaces) {
        acc[name] = interfaces.map(iface => ({
          address: iface.address,
          family: iface.family,
          internal: iface.internal,
        }));
      }
      return acc;
    }, {} as Record<string, any>),
  };

  // Get Next.js runtime information
  const runtimeInfo = {
    nodejs: process.version,
    nextjs: process.env.NEXT_RUNTIME || 'unknown',
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    request: requestInfo,
    environment: filteredEnv,
    server: serverInfo,
    runtime: runtimeInfo,
  });
}