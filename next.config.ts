import type { NextConfig } from "next";

// /api/* 요청은 ceoview-backend로 프록시한다. 화면의 fetch("/api/...")는 같은 출처 요청으로 유지되고,
// backend가 내려주는 세션 쿠키도 접속한 서브도메인의 쿠키로 저장된다.
const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "");

if (!backendUrl) {
  console.warn(
    "[ceoview-web] BACKEND_URL이 없습니다. /api/* 요청을 backend로 보낼 수 없습니다.",
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
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
