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
        destination: 'http://localhost:5555/knowledge/:path*',
      },
    ]
  },
}

export default nextConfig
