import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjects, getProjectBySlug, generateBriefing } from "@/lib/data";
import { STATUS_CONFIG } from "@/lib/types";
import PhaseProgress from "@/components/PhaseProgress";
import TodoList from "@/components/TodoList";
import BriefingPanel from "@/components/BriefingPanel";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const status = STATUS_CONFIG[project.status];
  const briefing = generateBriefing(project);

  return (
    <>
      <Link
        href="/"
        className="text-sm text-[#a1a1aa] hover:text-[#8b5cf6] transition-colors mb-6 inline-block"
      >
        ← 대시보드로 돌아가기
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: status.color + "20",
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>
        <p className="text-[#a1a1aa]">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 기본 정보 */}
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">
            기본 정보
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {project.url && (
              <div>
                <span className="text-[#a1a1aa]">URL: </span>
                {project.url.startsWith("http") ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b5cf6] hover:underline"
                  >
                    {project.url}
                  </a>
                ) : (
                  <span className="font-[var(--font-mono)]">{project.url}</span>
                )}
              </div>
            )}
            {project.github && (
              <div>
                <span className="text-[#a1a1aa]">GitHub: </span>
                <a
                  href={`https://github.com/${project.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8b5cf6] hover:underline"
                >
                  {project.github}
                </a>
              </div>
            )}
            <div>
              <span className="text-[#a1a1aa]">카테고리: </span>
              {project.category}
            </div>
            <div>
              <span className="text-[#a1a1aa]">스택: </span>
              {project.stack.join(", ")}
            </div>
            {project.workInstruction && (
              <div className="sm:col-span-2">
                <span className="text-[#a1a1aa]">작업지시서: </span>
                <span className="font-[var(--font-mono)] text-xs">
                  {project.workInstruction}
                </span>
              </div>
            )}
          </div>
          {project.notes && (
            <div className="mt-4 p-3 bg-[#0a0a12] rounded-lg border border-[#1e1e30]">
              <span className="text-xs text-[#a1a1aa]">메모: </span>
              <span className="text-sm">{project.notes}</span>
            </div>
          )}
        </div>

        {/* 다음 할 일 */}
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">
            📌 다음 할 일
          </h3>
          <TodoList todos={project.todos ?? []} />
        </div>
      </div>

      {/* Phase 진행 */}
      {project.phases && project.phases.length > 0 && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5 mb-8">
          <PhaseProgress phases={project.phases} />
        </div>
      )}

      {/* 클코 브리핑 */}
      <div className="mb-8">
        <BriefingPanel briefingText={briefing} />
      </div>

      {/* 활동 로그 */}
      {project.activities && project.activities.length > 0 && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">
            활동 로그
          </h3>
          <div className="space-y-2">
            {project.activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-[#a1a1aa] font-[var(--font-mono)] text-xs w-20 shrink-0">
                  {a.date}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG]
                        ?.color ?? "#6b7280",
                  }}
                />
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
