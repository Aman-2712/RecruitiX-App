import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config root for turbopack using absolute path
  turbopack: {
    root: process.cwd(),
  },
  // Vercel Skew Protection: Automatically sync client & server deployment versions
  // Prevents 'Failed to load static chunk / client-server mismatch' during live Vercel deployments
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || undefined,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Security & Skew Prevention Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
