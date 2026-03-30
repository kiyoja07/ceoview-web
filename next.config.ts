import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ceoview.edge.naverncp.com",
      },
    ],
  },
  transpilePackages: [
    "recharts",
    "victory-vendor",
    "d3-scale",
    "d3-array",
    "d3-color",
    "d3-interpolate",
    "d3-shape",
    "d3-path",
    "d3-time",
    "d3-time-format",
    "d3-format",
    "d3-ease",
    "d3-timer",
  ],
};

export default nextConfig;
