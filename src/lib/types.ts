export type ProjectStatus =
  | "deployed"
  | "running"
  | "developing"
  | "paused"
  | "planned"
  | "error"
  | "archived";

export type PhaseStatus = "done" | "in_progress" | "pending";

export interface Phase {
  name: string;
  status: PhaseStatus;
}

export interface Todo {
  text: string;
  done: boolean;
}

/** todos는 레거시 데이터에서 문자열 배열 또는 {text,done} 객체 배열 둘 다 존재 */
export type TodoItem = string | Todo;

export interface Activity {
  date: string;
  text: string;
  status: ProjectStatus;
}

export interface Project {
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  url: string | null;
  github: string | null;
  stack: string[];
  category: string;
  phases?: Phase[];
  todos?: TodoItem[];
  notes?: string;
  workInstruction?: string;
  activities?: Activity[];
  // 런타임에 채워지는 필드 (enrichProjects)
  lastActivityMs?: number;   // 실제 폴더 mtime 또는 최근 활동일
  daysIdle?: number;         // 마지막 활동 이후 경과일
  reviveHint?: string | null; // 페페의 "다시 돌리자" 판단 문구
  // archived 처리 시 원상태 보존 (되살리기용)
  _prevStatus?: string;
  _archivedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  skills: string[];
  status: "active" | "inactive";
}

export type OfficeZoneId = "dev" | "planning" | "ops" | "showcase" | "breakroom" | "debug" | "idle";

export type OfficeAgentState = "writing" | "executing" | "researching" | "idle" | "syncing" | "error";

export interface OfficeAssignment {
  slug: string;
  name: string;
  team: string[];
}

export interface AgentOfficeState {
  uid: string;           // 유니크 키 (agentId + projectSlug)
  agentId: string;
  name: string;
  emoji: string;
  role: string;
  zone: OfficeZoneId;
  state: OfficeAgentState;
  projectSlug: string;
  projectName: string;
}

export const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; emoji: string }
> = {
  deployed: { label: "배포 완료", color: "#22c55e", emoji: "🟢" },
  running: { label: "운영 중", color: "#3b82f6", emoji: "🔵" },
  developing: { label: "개발 중", color: "#eab308", emoji: "🟡" },
  paused: { label: "일시정지", color: "#6b7280", emoji: "⚪" },
  planned: { label: "계획 중", color: "#6b7280", emoji: "📋" },
  error: { label: "에러/긴급", color: "#ef4444", emoji: "🔴" },
  archived: { label: "보관됨", color: "#52525b", emoji: "📦" },
};
