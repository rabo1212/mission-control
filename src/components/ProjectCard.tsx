import Link from "next/link";
import { Project, STATUS_CONFIG } from "@/lib/types";
import BriefingButton from "./BriefingButton";

export default function ProjectCard({
  project,
  briefingText,
}: {
  project: Project;
  briefingText: string;
}) {
  const status = STATUS_CONFIG[project.status];
  const doneCount = project.phases?.filter((p) => p.status === "done").length ?? 0;
  const totalPhases = project.phases?.length ?? 0;

  return (
    <Link href={`/project/${project.slug}`}>
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5 hover:border-[#8b5cf6]/50 transition-all cursor-pointer group h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <h3 className="font-semibold text-base group-hover:text-[#8b5cf6] transition-colors">
              {project.name}
            </h3>
          </div>
          <span className="text-xs text-[#a1a1aa] bg-[#1e1e30] px-2 py-0.5 rounded-full whitespace-nowrap">
            {status.label}
          </span>
        </div>

        <p className="text-sm text-[#a1a1aa] mb-3 line-clamp-2">
          {project.description}
        </p>

        {totalPhases > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-[#a1a1aa] mb-1">
              <span>진행률</span>
              <span className="font-[var(--font-mono)]">
                {doneCount}/{totalPhases}
              </span>
            </div>
            <div className="h-1.5 bg-[#1e1e30] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(doneCount / totalPhases) * 100}%`,
                  backgroundColor: status.color,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-auto">
          {project.stack.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-[10px] text-[#a1a1aa] bg-[#1e1e30] px-1.5 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
          {project.stack.length > 3 && (
            <span className="text-[10px] text-[#a1a1aa]">
              +{project.stack.length - 3}
            </span>
          )}
        </div>

        {project.todos && project.todos.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1e1e30]">
            <p className="text-xs text-[#a1a1aa] truncate">
              📌 {project.todos[0]}
            </p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#1e1e30] flex justify-end">
          <BriefingButton briefingText={briefingText} />
        </div>
      </div>
    </Link>
  );
}
