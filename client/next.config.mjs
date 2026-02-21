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
        destination: 'https://spit-hackathon-o4kf.onrender.com/knowledge/:path*',
      },
    ]
  },
}

export default nextConfig
