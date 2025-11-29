/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',           // THIS IS THE ONLY LINE THAT MATTERS
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;