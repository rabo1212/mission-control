/**
 * SQLite 기반 데이터 레이어
 * - 기존 data.ts와 동일한 인터페이스 제공
 * - DATA_MODE=sqlite 일 때 사용
 */
import { dbGetProjects, dbGetProjectBySlug, dbGetAgents } from "./db";
import type { Project, Agent } from "./types";

export function getProjects(): Project[] {
  return dbGetProjects();
}

export function getAgents(): Agent[] {
  return dbGetAgents();
}

export function getProjectBySlug(slug: string): Project | undefined {
  return dbGetProjectBySlug(slug);
}

export { getStats, getUrgentSlugs, generateBriefing } from "./data";
