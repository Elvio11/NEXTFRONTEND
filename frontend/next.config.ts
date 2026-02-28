import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    // ESLint v8 is incompatible with Next.js 15 flat config format
    // TODO: upgrade to eslint v9 in Phase 5.2
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

