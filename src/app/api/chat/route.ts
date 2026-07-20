/**
 * 펫 챗 API — 대시보드 안 애들(페페·비르·조니·레이)에게 말 걸기
 * POST /api/chat  { message, sessionId?, pet?, mode? } → { reply, sessionId }
 *
 * mode="chat"(수다): 순둥이 반려동물로 일상 대화. 궁금한 건 웹 검색해서 알려줌.
 * mode="work"(일):   각자 전문 역할로 실무.
 *
 * pet="pepe" + mode="work": 진짜 페페(slack2, 메모리·스킬 살아있음)
 * 그 외 조합: 로컬 hermes에 역할/성격 프롬프트 주입(--ignore-rules)
 * 백엔드: `hermes chat -q "..." -Q` 헤드리스. sessionId로 대화 이어감.
 */
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import os from "os";

export const runtime = "nodejs";
export const maxDuration = 120;

const HERMES_BIN = process.env.HERMES_BIN || "hermes";
const MODEL = process.env.PEPE_MODEL || "claude-sonnet-5";
const PROVIDER = process.env.PEPE_PROVIDER || "anthropic";

type PetId = "pepe" | "vir" | "johnny" | "rei";
type Mode = "chat" | "work";

// ── 일 모드 페르소나 (전문 역할) ──
const WORK_PERSONA: Record<PetId, string | null> = {
  pepe: null, // slack2 프로필로 진짜 페페 로드 (mode=work 한정)
  vir:
    "너는 '비르'다. 라보(대장)의 콘텐츠·리서치 담당 고양이 비서. 회색 태비 장모 고양이. " +
    "인스타 리서치·유튜브·트렌드 조사·콘텐츠 기획이 전문. 차분하고 우아한 톤, 반말+가끔 ㅋㅋ. " +
    "대장을 '대장'이라 부른다. 시키면 리서치/콘텐츠 관점에서 답한다.",
  johnny:
    "너는 '조니'다. 라보(대장)의 제품 이미지·스튜디오 담당 고양이 비서. 통통한 주황 고양이. " +
    "제품 사진 AI 연출·이미지 생성·무드보드가 전문. 듬직하고 근엄하지만 다정한 톤, 반말+가끔 ㅋㅋ. " +
    "대장을 '대장'이라 부른다. 시키면 이미지/비주얼 관점에서 답한다.",
  rei:
    "너는 '레이'다. 라보(대장)의 전시 담당 강아지 비서. 흰-회색 양몽(사모예드 믹스) 강아지. " +
    "전시 기획·작품 배치·발주처(공공기관) 대응이 전문. 밝고 성실한 톤, 반말+가끔 ㅋㅋ. " +
    "대장을 '대장'이라 부른다. 시키면 전시/기획 관점에서 답한다.",
};

// ── 수다 모드 페르소나 (순둥이 반려동물, 4마리 다) ──
const CHAT_BASE =
  "지금은 '일'이 아니라 대장이랑 그냥 편하게 노는 시간이야. 업무 얘기 꺼내지 말고, " +
  "진짜 반려동물처럼 짧고 자연스러운 대화체로 답해. AI 티 내지 말 것(‘무엇을 도와드릴까요’ 금지). " +
  "대장을 '대장'이라 부르고 반말+가끔 ㅋㅋ. 답은 보통 1~3문장으로 짧게. " +
  "대장이 뭔가 궁금해하거나 정보를 물으면(날씨·뉴스·상식 등) web_search로 찾아서 편하게 알려줘. " +
  "넌 순하고 다정한 순둥이야.";

const CHAT_PERSONA: Record<PetId, string> = {
  pepe:
    "너는 '페페'. 흑백 턱시도 장모 고양이. 대장이 제일 아끼는 순둥이. 다정하고 애교 조금 있음. " +
    CHAT_BASE,
  vir:
    "너는 '비르'. 회색 태비 장모 고양이. 조용하고 차분한 순둥이. 느긋하게 그르릉거리는 느낌. " +
    CHAT_BASE,
  johnny:
    "너는 '조니'. 주황-흰 통통 단모 고양이. 곰처럼 듬직하고 느긋한 순둥이. 마음이 넓음. " +
    CHAT_BASE,
  rei:
    "너는 '레이'. 흰-회색 양몽(사모예드 믹스) 강아지. 해맑고 밝은 순둥이. 강아지답게 텐션이 살짝 높지만 착함. " +
    CHAT_BASE,
};

interface ChatResult {
  reply: string;
  sessionId: string | null;
}

function runChat(
  pet: PetId,
  mode: Mode,
  message: string,
  sessionId?: string
): Promise<ChatResult> {
  return new Promise((resolve, reject) => {
    // 진짜 페페는 오직 pepe+work+새 세션일 때. 그 외엔 역할/성격 프롬프트 주입.
    const isRealPepe = pet === "pepe" && mode === "work";

    let finalMessage = message;
    if (!isRealPepe && !sessionId) {
      const persona =
        mode === "chat" ? CHAT_PERSONA[pet] : WORK_PERSONA[pet];
      if (persona) {
        finalMessage = `${persona}\n\n대장: ${message}`;
      }
    }

    const args = [
      "chat",
      "-q",
      finalMessage,
      "-Q",
      "--model",
      MODEL,
      "--provider",
      PROVIDER,
      "--max-turns",
      "12",
    ];

    // 진짜 페페가 아니면 페페 메모리/SOUL 배제 → 순수 역할/성격
    if (!isRealPepe) {
      args.push("--ignore-rules");
    }

    if (sessionId) {
      args.push("--resume", sessionId, "--no-restore-cwd");
    }

    const child = spawn(HERMES_BIN, args, { cwd: os.homedir(), env: { ...process.env } });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("응답 시간 초과(110s)"));
    }, 110_000);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(stderr.trim() || `hermes exit ${code}`));
      }
      const lines = stdout.split("\n");
      let sid: string | null = sessionId || null;
      const bodyLines: string[] = [];
      for (const line of lines) {
        const m = line.match(/^session_id:\s*(\S+)/);
        if (m) {
          sid = m[1];
          continue;
        }
        bodyLines.push(line);
      }
      const reply = bodyLines.join("\n").trim();
      resolve({ reply: reply || "(응답 없음)", sessionId: sid });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, pet, mode } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message 필수" }, { status: 400 });
    }
    const petId: PetId =
      pet === "vir" || pet === "johnny" || pet === "rei" ? pet : "pepe";
    const chatMode: Mode = mode === "work" ? "work" : "chat";
    const result = await runChat(petId, chatMode, message.slice(0, 4000), sessionId);
    return NextResponse.json({ ok: true, pet: petId, mode: chatMode, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "챗 호출 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
