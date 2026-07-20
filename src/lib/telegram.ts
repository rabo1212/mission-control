/**
 * 텔레그램 알림 모듈
 * - 에러/긴급 상황 자동 알림
 * - 봇 토큰과 챗 ID는 환경변수에서 로드
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export interface TelegramMessage {
  level: "info" | "warn" | "error" | "critical";
  source: string;
  message: string;
  details?: string;
}

const LEVEL_EMOJI: Record<string, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  critical: "🚨",
};

export async function sendTelegramAlert(msg: TelegramMessage): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN 또는 CHAT_ID 미설정, 알림 스킵");
    return false;
  }

  const emoji = LEVEL_EMOJI[msg.level] || "📢";
  const text = [
    `${emoji} *Mission Control Alert*`,
    "",
    `*레벨:* ${msg.level.toUpperCase()}`,
    `*출처:* ${msg.source}`,
    `*내용:* ${msg.message}`,
    msg.details ? `\n\`\`\`\n${msg.details}\n\`\`\`` : "",
    "",
    `🕐 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      console.error(`[Telegram] 전송 실패: ${res.status} ${res.statusText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram] 네트워크 에러:", err);
    return false;
  }
}

// 프로젝트 에러 알림
export async function alertProjectError(projectName: string, error: string) {
  return sendTelegramAlert({
    level: "error",
    source: projectName,
    message: `프로젝트 에러 발생`,
    details: error,
  });
}

// 에이전트 상태 이상 알림
export async function alertAgentDown(agentName: string, reason: string) {
  return sendTelegramAlert({
    level: "critical",
    source: `에이전트: ${agentName}`,
    message: `에이전트 비정상 상태`,
    details: reason,
  });
}

// 비용 초과 알림
export async function alertCostThreshold(currentCost: number, threshold: number) {
  return sendTelegramAlert({
    level: "warn",
    source: "비용 모니터",
    message: `일일 비용 $${currentCost.toFixed(4)} → 임계값 $${threshold.toFixed(2)} 초과!`,
  });
}

// 밀린 작업 알림
export async function alertStaleProjects(projectNames: string[]) {
  return sendTelegramAlert({
    level: "warn",
    source: "프로젝트 모니터",
    message: `${projectNames.length}개 프로젝트 5일 이상 방치`,
    details: projectNames.join("\n"),
  });
}
