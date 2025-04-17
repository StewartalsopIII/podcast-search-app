/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Configure URL handling
  experimental: {
    // Add any other experimental features as needed
  },
};

export default nextConfig;