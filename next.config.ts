import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/login", destination: "/login.html" }];
  },
  async redirects() {
    return [
      { source: "/app.html", destination: "/dashboard", permanent: false },
      { source: "/supervise.html", destination: "/watch", permanent: false },
      { source: "/plan.html", destination: "/plan", permanent: false },
      { source: "/metrics.html", destination: "/metrics", permanent: false },
      { source: "/mortgage.html", destination: "/watch", permanent: false },
    ];
  },
};

export default nextConfig;
