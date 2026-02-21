import { Project, Agent } from "./types";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "projects.json");
const AGENTS_PATH = path.join(process.cwd(), "data", "agents.json");

export function getProjects(): Project[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
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
  if (project.stack.length) lines.push(`기술: ${project.stack.join(", ")}`);
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
    project.todos.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
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
