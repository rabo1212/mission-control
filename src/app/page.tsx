import { getProjects, getStats, getUrgentSlugs, generateBriefing, enrichProjects } from "@/lib/data";
import Dashboard from "@/components/Dashboard";
import Timeline from "@/components/Timeline";
import ArchivedSection from "@/components/ArchivedSection";

export default function Home() {
  const allProjects = enrichProjects(getProjects());
  // 보관됨(archived)은 기본 목록에서 제외
  const projects = allProjects.filter((p) => p.status !== "archived");
  const archived = allProjects.filter((p) => p.status === "archived");
  const stats = getStats(projects);
  const urgentSlugs = getUrgentSlugs(projects);

  // 최근 활동순으로 이미 정렬됨(enrichProjects). 그 순서를 sortedSlugs로 사용.
  const sorted = projects;

  // 페페의 "다시 돌리자" 후보 (reviveHint 있는 것 중 최근성 낮은 순, 보관됨 제외)
  const reviveCandidates = projects
    .filter((p) => p.reviveHint)
    .sort((a, b) => (b.daysIdle ?? 0) - (a.daysIdle ?? 0))
    .slice(0, 4);

  const briefings: Record<string, string> = {};
  for (const p of allProjects) {
    briefings[p.slug] = generateBriefing(p);
  }

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎯 <span>MISSION CONTROL</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            대장님의 프로젝트 통합 대시보드 · <span className="text-[#8b5cf6]">최근 활동순</span>
          </p>
        </div>
        <div className="text-xs text-[#a1a1aa] font-[var(--font-mono)]">
          {new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      </header>

      {/* 🐸 페페의 되살리기 제안 */}
      {reviveCandidates.length > 0 && (
        <section className="mb-6 rounded-2xl border border-[#8b5cf6]/25 bg-gradient-to-br from-[#1a1030] to-[#13131f] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🐸</span>
            <h2 className="text-sm font-bold text-white">페페 제안 — 다시 돌리면 좋을 프로젝트</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reviveCandidates.map((p) => (
              <a
                key={p.slug}
                href={`/project/${p.slug}`}
                className="flex items-center justify-between gap-2 bg-[#0f0f1a]/60 border border-[#2a2a45] rounded-lg px-3 py-2 hover:border-[#8b5cf6]/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-[#a78bfa]">{p.reviveHint}</div>
                </div>
                <span className="text-[10px] text-[#52525b] shrink-0">
                  {p.daysIdle}일 전
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <Dashboard
        projects={projects}
        stats={stats}
        briefings={briefings}
        urgentSlugs={urgentSlugs}
        sortedSlugs={sorted.map((p) => p.slug)}
      />

      <ArchivedSection projects={archived} />

      <section>
        <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <Timeline projects={projects} />
        </div>
      </section>
    </>
  );
}
