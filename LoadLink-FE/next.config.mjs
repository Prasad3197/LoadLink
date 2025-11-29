/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',           // THIS IS THE MAGIC LINE – forces .next/standalone folder
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true             // most college setups need this
  },
  // Optional – makes build faster & smaller in CI
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;