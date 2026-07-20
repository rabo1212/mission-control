/**
 * 로그인 API
 * POST /api/auth/login → 비밀번호 인증 + 세션 쿠키 설정
 */
import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, COOKIE_NAME, SESSION_DURATION } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || !checkPassword(password)) {
      return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });
    }

    const token = createSessionToken();
    const res = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 });
  }
}
