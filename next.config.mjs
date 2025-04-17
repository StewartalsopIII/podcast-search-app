/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Prevent 0.0.0.0 from appearing in URLs
  assetPrefix: process.env.NEXT_PUBLIC_SITE_URL || 'https://search.getcrazywisdom.com',
  
  // Configure URL handling
  experimental: {
    // Add any other experimental features as needed
  },
  
  // Set custom headers to ensure proper redirects
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Forwarded-Host',
            value: 'search.getcrazywisdom.com',
          },
        ],
      },
    ]
  },
};

export default nextConfig;