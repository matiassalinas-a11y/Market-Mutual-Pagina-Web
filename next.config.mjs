import { networkInterfaces } from 'node:os'

const localDevelopmentOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((address) => address?.family === 'IPv4' && !address.internal)
  .map((address) => address.address)

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['127.0.0.1', ...localDevelopmentOrigins],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
