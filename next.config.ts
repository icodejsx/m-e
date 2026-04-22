import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") ??
  "https://app-service.icadpays.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/be-api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
