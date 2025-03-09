/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add experimental features if needed
  experimental: {
    serverActions: true,
  },
  // Add webpack configuration
  webpack: (config, { isServer }) => {
    // Add any custom webpack configurations here
    return config;
  },
};

module.exports = nextConfig;
