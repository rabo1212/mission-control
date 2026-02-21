export type ProjectStatus =
  | "deployed"
  | "running"
  | "developing"
  | "paused"
  | "planned"
  | "error";

export type PhaseStatus = "done" | "in_progress" | "pending";

export interface Phase {
  name: string;
  status: PhaseStatus;
}

export interface Todo {
  text: string;
  done: boolean;
}

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
  todos?: string[];
  notes?: string;
  workInstruction?: string;
  activities?: Activity[];
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
};
