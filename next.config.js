/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'www.nintendo.com',
      }
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 優化 Vercel 構建  
  serverExternalPackages: ['firebase-admin'],
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      // 在生產構建中外部化 Firebase Admin
      config.externals = [...(config.externals || []), 'firebase-admin']
    }
    return config
  },
}

module.exports = nextConfig