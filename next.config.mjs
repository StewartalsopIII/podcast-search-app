/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure redirects or rewrites as needed for auth flows
  // redirects: async () => { ... },
  // Add any customizations for server-side processing
  // Remove serverActions flag as it's now enabled by default in Next.js 14.2.x
  experimental: {
    // Add any other experimental features as needed
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
};

export default nextConfig;