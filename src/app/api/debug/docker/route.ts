import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    // Get Docker information
    let dockerInfo = {};
    try {
      // Get Docker version
      const { stdout: version } = await execAsync('docker --version');
      
      // Get running containers
      const { stdout: containers } = await execAsync('docker ps');
      
      // Get this container's info
      const { stdout: thisContainer } = await execAsync('docker ps | grep podcast-search-app || echo "Container not found"');
      
      // Get images
      const { stdout: images } = await execAsync('docker images');
      
      // Get Docker Compose version
      const { stdout: composeVersion } = await execAsync('docker-compose --version');
      
      // Get docker-compose.yml file content
      const { stdout: composeFile } = await execAsync('cat /home/newuser/podcast-search-app/docker-compose.yml || echo "File not found"');
      
      // Get Docker container logs (last 20 lines)
      const { stdout: logs } = await execAsync('docker logs podcast-search-app --tail 20 2>&1 || echo "Log not available"');
      
      dockerInfo = {
        version: version.trim(),
        composeVersion: composeVersion.trim(),
        containers: containers,
        thisContainer: thisContainer,
        images: images,
        composeFile: composeFile,
        recentLogs: logs,
      };
    } catch (error) {
      dockerInfo = { error: 'Failed to get Docker information', details: error };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      docker: dockerInfo,
      request: {
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get Docker information', details: error },
      { status: 500 }
    );
  }
}