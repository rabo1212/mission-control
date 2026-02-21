"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import SummaryCards, { FilterKey } from "./SummaryCards";
import ProjectCard from "./ProjectCard";

interface DashboardProps {
  projects: Project[];
  stats: { total: number; deployed: number; developing: number; paused: number; urgent: number };
  briefings: Record<string, string>;
  urgentSlugs: string[];
  sortedSlugs: string[];
}

const filterLabels: Record<FilterKey, string> = {
  total: "전체 프로젝트",
  deployed: "배포/운영 중",
  developing: "개발 중",
  paused: "일시정지",
  urgent: "밀린 작업",
};

export default function Dashboard({
  projects,
  stats,
  briefings,
  urgentSlugs,
  sortedSlugs,
}: DashboardProps) {
  const [filter, setFilter] = useState<FilterKey | null>(null);

  const projectMap = new Map(projects.map((p) => [p.slug, p]));
  const sorted = sortedSlugs.map((s) => projectMap.get(s)!);

  const filtered = filter
    ? sorted.filter((p) => {
        switch (filter) {
          case "total":
            return true;
          case "deployed":
            return p.status === "deployed" || p.status === "running";
          case "developing":
            return p.status === "developing";
          case "paused":
            return p.status === "paused";
          case "urgent":
            return urgentSlugs.includes(p.slug);
        }
      })
    : sorted;

  return (
    <>
      <SummaryCards stats={stats} activeFilter={filter} onFilter={setFilter} />

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">
            {filter ? filterLabels[filter] : "프로젝트"}
          </h2>
          {filter && (
            <span className="text-xs text-[#a1a1aa] bg-[#1e1e30] px-2 py-0.5 rounded-full">
              {filtered.length}개
            </span>
          )}
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
            >
              전체 보기 ×
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.slug}
              project={p}
              briefingText={briefings[p.slug]}
            />
          ))}
        </div>
      </section>
    </>
  );
}
