import { getProjects, getStats, generateBriefing } from "@/lib/data";
import SummaryCards from "@/components/SummaryCards";
import ProjectCard from "@/components/ProjectCard";
import Timeline from "@/components/Timeline";

export default function Home() {
  const projects = getProjects();
  const stats = getStats(projects);

  const statusOrder: Record<string, number> = {
    error: 0,
    developing: 1,
    running: 2,
    deployed: 3,
    planned: 4,
    paused: 5,
  };
  const sorted = [...projects].sort(
    (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
  );

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎯 <span>MISSION CONTROL</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            대장님의 프로젝트 통합 대시보드
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

      <SummaryCards stats={stats} />

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">프로젝트</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((p) => (
            <ProjectCard
              key={p.slug}
              project={p}
              briefingText={generateBriefing(p)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <Timeline projects={projects} />
        </div>
      </section>
    </>
  );
}
