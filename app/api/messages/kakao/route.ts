import { NextRequest, NextResponse } from "next/server";
import { authorizeMessageApiRequest } from "@/app/lib/messages/api-auth";
import { sendKakaoMessage } from "@/app/lib/messages/kakao";
import { MessageSendValidationError } from "@/app/lib/messages/shared";

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeMessageApiRequest(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      to?: string;
      body?: string;
      templateCode?: string;
      buttons?: unknown;
    };

    await sendKakaoMessage({
      to: body.to ?? "",
      body: body.body ?? "",
      templateCode: body.templateCode,
      buttons: body.buttons as never,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MessageSendValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Kakao message API error:", error);
    return NextResponse.json(
      { error: "카카오톡 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
