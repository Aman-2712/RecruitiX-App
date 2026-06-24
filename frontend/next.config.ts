import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config root for turbopack using absolute path
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
