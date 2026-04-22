import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img1.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img2.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img3.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img9.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img.megbook.hk",
      }
    ]
  }
};

export default nextConfig;
