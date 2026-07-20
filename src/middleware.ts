/**
 * 인증 미들웨어
 * - MC_PASSWORD 설정 시 모든 페이지에 비밀번호 필요
 * - /api/auth/login, /login 은 제외
 * - /api/token-usage POST는 외부에서 호출할 수 있도록 허용
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mc_session";

function verifyToken(token: string): boolean {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const expires = parseInt(parts[1]);
    if (isNaN(expires) || Date.now() > expires) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const password = process.env.MC_PASSWORD;

  // 비밀번호 미설정 시 인증 스킵
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // 인증 불필요 경로
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/token-usage") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 세션 쿠키 확인
  const session = req.cookies.get(COOKIE_NAME);
  if (session && verifyToken(session.value)) {
    return NextResponse.next();
  }

  // 미인증 → 로그인 페이지로 리다이렉트
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
