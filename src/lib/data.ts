import { Project, Agent } from "./types";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "projects.json");
const AGENTS_PATH = path.join(process.cwd(), "data", "agents.json");

export function getProjects(): Project[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

const HOME = process.env.HOME || "/Users/labo";

/** slug/name으로 홈폴더의 실제 프로젝트 디렉토리 mtime을 찾는다 */
function folderMtime(p: Project): number | null {
  const candidates = [p.slug, p.name];
  for (const c of candidates) {
    if (!c) continue;
    const dir = path.join(HOME, c);
    try {
      const st = fs.statSync(dir);
      if (st.isDirectory()) {
        // src나 주요 하위 파일의 최근 수정으로 보정
        let m = st.mtimeMs;
        for (const probe of ["src", "app", "package.json", "main.py"]) {
          const pp = path.join(dir, probe);
          try {
            const s2 = fs.statSync(pp);
            if (s2.mtimeMs > m) m = s2.mtimeMs;
          } catch {}
        }
        return m;
      }
    } catch {}
  }
  return null;
}

/**
 * 프로젝트에 최근성 + "다시 돌리자" 판단을 붙인다.
 * lastActivityMs = 실제 폴더 mtime(있으면) 우선, 없으면 activities[0].date.
 * reviveHint = 멈춤/방치 판단 문구(페페 관점).
 */
export function enrichProjects(projects: Project[]): Project[] {
  const now = Date.now();
  const enriched = projects.map((p) => {
    const fm = folderMtime(p);
    const actMs = p.activities?.[0]?.date ? new Date(p.activities[0].date).getTime() : 0;
    const lastActivityMs = Math.max(fm ?? 0, actMs) || actMs || 0;
    const daysIdle = lastActivityMs ? Math.floor((now - lastActivityMs) / 86400000) : 999;

    let reviveHint: string | null = null;
    if (p.status === "error") {
      reviveHint = "🚨 에러 상태 — 바로 봐야 함";
    } else if (p.status === "paused") {
      reviveHint =
        daysIdle > 60
          ? `⏸️ ${daysIdle}일째 멈춤 — 접을지 되살릴지 결정할 때`
          : "⏸️ 일시정지 — 다시 돌리면 좋을 후보";
    } else if (p.status === "developing" && daysIdle >= 5) {
      reviveHint = `🔧 개발중인데 ${daysIdle}일 방치 — 다시 손대면 좋겠음`;
    } else if (p.status === "running" && daysIdle >= 14) {
      reviveHint = `⚙️ 운영중인데 ${daysIdle}일 조용 — 점검 필요`;
    }

    return { ...p, lastActivityMs, daysIdle, reviveHint };
  });
  // 최근 활동순 정렬
  enriched.sort((a, b) => (b.lastActivityMs ?? 0) - (a.lastActivityMs ?? 0));
  return enriched;
}

export function getAgents(): Agent[] {
  const raw = fs.readFileSync(AGENTS_PATH, "utf-8");
  return JSON.parse(raw);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getStats(projects: Project[]) {
  const now = new Date();
  const staleDays = 5;

  const urgent = projects.filter((p) => {
    if (p.status === "error") return true;
    if (p.status === "developing" && p.activities?.length) {
      const lastDate = new Date(p.activities[0].date);
      const diff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= staleDays;
    }
    return false;
  });

  return {
    total: projects.length,
    deployed: projects.filter(
      (p) => p.status === "deployed" || p.status === "running"
    ).length,
    developing: projects.filter((p) => p.status === "developing").length,
    paused: projects.filter((p) => p.status === "paused").length,
    urgent: urgent.length,
  };
}

export function getUrgentSlugs(projects: Project[]): string[] {
  const now = new Date();
  const staleDays = 5;
  return projects
    .filter((p) => {
      if (p.status === "error") return true;
      if (p.status === "developing" && p.activities?.length) {
        const lastDate = new Date(p.activities[0].date);
        const diff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= staleDays;
      }
      return false;
    })
    .map((p) => p.slug);
}

export function generateBriefing(project: Project): string {
  const lines: string[] = [];
  lines.push(`📋 프로젝트 브리핑: ${project.name}`);
  lines.push("");

  const statusMap: Record<string, string> = {
    deployed: "배포 완료",
    running: "운영 중",
    developing: "개발 중",
    paused: "일시정지",
    planned: "계획 중",
    error: "에러/긴급",
  };

  lines.push(`상태: ${statusMap[project.status] || project.status}`);
  if (project.url) lines.push(`URL: ${project.url}`);
  if (project.github) lines.push(`GitHub: ${project.github}`);
  if (project.stack?.length) lines.push(`기술: ${project.stack.join(", ")}`);
  lines.push("");

  if (project.phases?.length) {
    const donePhases = project.phases.filter((p) => p.status === "done");
    if (donePhases.length) {
      lines.push("완료된 것:");
      donePhases.forEach((p) => lines.push(`- ${p.name}`));
      lines.push("");
    }

    const currentPhases = project.phases.filter(
      (p) => p.status === "in_progress"
    );
    if (currentPhases.length) {
      lines.push("진행 중:");
      currentPhases.forEach((p) => lines.push(`- ${p.name}`));
      lines.push("");
    }
  }

  if (project.todos?.length) {
    lines.push("다음 할 일:");
    project.todos.forEach((t, i) => {
      const txt = typeof t === "string" ? t : t?.text ?? "";
      lines.push(`${i + 1}. ${txt}`);
    });
    lines.push("");
  }

  if (project.notes) {
    lines.push(`메모: ${project.notes}`);
    lines.push("");
  }

  if (project.workInstruction) {
    lines.push(`작업지시서: ${project.workInstruction}`);
  }

  return lines.join("\n");
}
