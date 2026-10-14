import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/login", destination: "/login.html" }];
  },
};

export default nextConfig;
