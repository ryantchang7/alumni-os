import type { NextConfig } from "next";
import path from "path";

// Cast required: NextConfig types lag behind Next.js 16 turbopack options
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // Legacy root redirects — sub-paths remain accessible at their original URLs
      { source: '/builder', destination: '/build', permanent: false },
      { source: '/network', destination: '/player', permanent: false },
      { source: '/review', destination: '/internal', permanent: false },
      {
        source: '/teams/penn-mens-golf',
        destination: '/player?teamSlug=penn-mens-golf',
        permanent: false,
      },
    ]
  },
} as NextConfig;

export default nextConfig;
