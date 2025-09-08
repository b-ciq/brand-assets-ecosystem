import type { NextConfig } from "next";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const nextConfig: NextConfig = {
  // Enable static export for demo deployment
  ...(isDemoMode && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    eslint: {
      ignoreDuringBuilds: true
    },
    typescript: {
      ignoreBuildErrors: true
    }
  }),
  
  // Asset handling
  assetPrefix: isDemoMode ? '' : undefined,
  
  // Environment variables
  env: {
    DEMO_MODE: isDemoMode ? 'true' : 'false',
  }
};

export default nextConfig;
