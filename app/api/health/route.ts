import { NextResponse } from "next/server";
import pkg from "@/package.json";

// Liveness probe: 프로세스 생존만 확인한다(DB/외부 연동 접근 없음).
// 로드밸런서/컨테이너 오케스트레이터의 liveness check 용도.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: pkg.version,
    timestamp: new Date().toISOString(),
  });
}
