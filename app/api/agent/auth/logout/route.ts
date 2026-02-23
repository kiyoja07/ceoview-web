import { NextResponse } from "next/server";
import { clearAgentSession } from "@/app/lib/agent-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAgentSession(response);
  return response;
}
