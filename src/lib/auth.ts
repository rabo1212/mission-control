/**
 * 간단한 비밀번호 인증
 * - 쿠키 기반 세션
 * - MC_PASSWORD 환경변수로 비밀번호 설정
 */
import { cookies } from "next/headers";

const PASSWORD = process.env.MC_PASSWORD || "";
const JWT_SECRET = process.env.MC_JWT_SECRET || "mission-control-default-secret";
const COOKIE_NAME = "mc_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

// 간단한 HMAC 서명 (crypto 없이 문자열 해싱)
function simpleHash(input: string): string {
  let hash = 0;
  const str = input + JWT_SECRET;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수 변환
  }
  return Math.abs(hash).toString(36) + "-" + str.length.toString(36);
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION;
  const payload = `mc:${expires}`;
  const sig = simpleHash(payload);
  return `${payload}:${sig}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;

    const payload = `${parts[0]}:${parts[1]}`;
    const sig = parts[2];
    const expectedSig = simpleHash(payload).split("-")[0];

    if (!sig.startsWith(expectedSig.slice(0, 6))) return false;

    const expires = parseInt(parts[1]);
    if (isNaN(expires) || Date.now() > expires) return false;

    return true;
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  if (!PASSWORD) return true; // 비밀번호 미설정 시 인증 스킵
  return input === PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  if (!PASSWORD) return true; // 비밀번호 미설정 시 항상 인증됨

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);
    if (!session) return false;
    return verifySessionToken(session.value);
  } catch {
    return false;
  }
}

export { COOKIE_NAME, SESSION_DURATION };
