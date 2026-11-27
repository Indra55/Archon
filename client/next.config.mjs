/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/knowledge/:path*',
        destination: `${process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555'}/knowledge/:path*`,
      },
    ]
  },
}

export default nextConfig
