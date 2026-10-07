import { NextRequest, NextResponse } from "next/server";
import { authorizeMessageApiRequest } from "@/app/lib/messages/api-auth";
import { MessageSendValidationError } from "@/app/lib/messages/shared";
import { sendSms } from "@/app/lib/messages/sms";

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeMessageApiRequest(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      to?: string;
      content?: string;
      subject?: string;
    };

    await sendSms({
      to: body.to ?? "",
      content: body.content ?? "",
      subject: body.subject,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MessageSendValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("SMS message API error:", error);
    return NextResponse.json(
      { error: "문자 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
