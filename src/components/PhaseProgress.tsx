import { Phase } from "@/lib/types";

const PHASE_COLORS: Record<string, string> = {
  done: "#22c55e",
  in_progress: "#eab308",
  pending: "#1e1e30",
};

export default function PhaseProgress({ phases }: { phases: Phase[] }) {
  if (!phases.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">
        Phase 진행
      </h3>
      {phases.map((phase, i) => {
        const color = PHASE_COLORS[phase.status];
        const statusLabel =
          phase.status === "done"
            ? "완료"
            : phase.status === "in_progress"
              ? "진행 중"
              : "대기";
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#1e1e30] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: phase.status === "pending" ? "0%" : "100%",
                  backgroundColor: color,
                  opacity: phase.status === "in_progress" ? 0.7 : 1,
                }}
              />
            </div>
            <span className="text-sm w-48 truncate">{phase.name}</span>
            <span
              className="text-xs font-[var(--font-mono)] w-14 text-right"
              style={{ color }}
            >
              {statusLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
