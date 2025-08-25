import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable experimental features
  experimental: {
    // Turbopack for faster builds
    turbo: {},
  },

  // Basic headers for API routes
  async headers() {
    return [
      {
        // API route headers
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },

  // Image optimization settings
  images: {
    domains: ['docs.google.com', 'drive.google.com'],
    unoptimized: true,
  },

  // Output configuration
  output: 'standalone',

  // Security headers
  poweredByHeader: false,
};

export default nextConfig;
