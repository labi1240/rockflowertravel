import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/api/media/file/**' },
      // Public marketing assets (logos, location photos, hero banner).
      { pathname: '/images/**' },
      { pathname: '/main_logo.png' },
      { pathname: '/white_logo.png' },
    ],
    // UploadThing-hosted CMS media (v7 serves from <appId>.ufs.sh; utfs.io legacy).
    remotePatterns: [
      { protocol: 'https', hostname: '*.ufs.sh', pathname: '/f/**' },
      { protocol: 'https', hostname: 'utfs.io', pathname: '/f/**' },
    ],
    // Serve modern formats and cache optimized variants for a year so the
    // image optimizer doesn't re-fetch/re-encode on every request.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Static marketing assets in /public are immutable — cache hard at the
        // edge/browser so bots and repeat visitors don't re-pull them from origin.
        source: '/:file*.(mp4|webm|png|jpg|jpeg|webp|avif|svg|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
