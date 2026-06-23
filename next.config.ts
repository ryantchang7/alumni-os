import type { NextConfig } from "next";
import path from "path";

// Cast required: NextConfig types lag behind Next.js 16 turbopack options
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ['cheerio', 'parse5', 'parse5-htmlparser2-tree-adapter', 'htmlparser2'],
  transpilePackages: ['framer-motion'],
  typescript: {
    // Type errors now FAIL the build (defense-in-depth) — catches DTO-shape
    // mistakes like a route accidentally returning a raw enrichment/PII object.
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      // Legacy root redirects
      { source: '/builder', destination: '/build', permanent: false },
      { source: '/network', destination: '/player', permanent: false },
      { source: '/review', destination: '/internal', permanent: false },
      {
        source: '/teams/penn-mens-golf',
        destination: '/player?teamSlug=penn-mens-golf',
        permanent: false,
      },
      // Zombie sub-path redirects
      { source: '/network/search', destination: '/player', permanent: false },
      { source: '/network/alumni/:id', destination: '/player/alumni/:id', permanent: false },
      { source: '/network/outreach/:id', destination: '/player/outreach/:id', permanent: false },
      { source: '/teams/penn-mens-golf/search', destination: '/player', permanent: false },
      {
        source: '/teams/penn-mens-golf/alumni/:id',
        destination: '/player/alumni/:id',
        permanent: false,
      },
      {
        source: '/teams/penn-mens-golf/outreach/:id',
        destination: '/player/outreach/:id',
        permanent: false,
      },
      { source: '/review/candidates', destination: '/internal', permanent: false },
      { source: '/review/sources', destination: '/internal', permanent: false },
      { source: '/teams/penn-mens-golf/agent', destination: '/build', permanent: false },
      { source: '/teams/penn-mens-golf/review', destination: '/build', permanent: false },
      { source: '/teams/penn-mens-golf/scraper', destination: '/build', permanent: false },
      { source: '/app', destination: '/', permanent: false },
      { source: '/player/relationships', destination: '/player', permanent: false },
      // Builder sub-paths → internal
      { source: '/builder', destination: '/internal', permanent: false },
      { source: '/builder/:path*', destination: '/internal', permanent: false },
    ]
  },
} as NextConfig;

export default nextConfig;
