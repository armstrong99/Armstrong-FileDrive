import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This allows production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  /* config options here */
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
