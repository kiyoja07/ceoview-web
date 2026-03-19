import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/messages/email";
import { MessageSendValidationError } from "@/app/lib/messages/shared";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      to?: string;
      title?: string;
      body?: string;
    };

    await sendEmail({
      to: body.to ?? "",
      title: body.title ?? "",
      body: body.body ?? "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MessageSendValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Email message API error:", error);
    return NextResponse.json(
      { error: "이메일 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
