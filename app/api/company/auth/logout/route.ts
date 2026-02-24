import { NextResponse } from "next/server";
import { clearCompanySession } from "@/app/lib/company-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCompanySession(response);
  return response;
}
