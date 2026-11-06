import type { NextConfig } from 'next';
import os from 'os';

function getNetworkOrigins(): string[] {
  const origins = ['localhost', 'localhost:3000', '127.0.0.1', '127.0.0.1:3000'];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4') {
        origins.push(net.address);
        origins.push(`${net.address}:3000`);
      }
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getNetworkOrigins(),
};

export default nextConfig;
