import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tracker.a664197d92717007b1b273365770c296.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
