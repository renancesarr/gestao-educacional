import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: { proxyClientMaxBodySize: '128mb' },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ];
  },
};

export default nextConfig;
