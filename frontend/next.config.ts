import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Some features are canary only or renamed in 15.5.x
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
