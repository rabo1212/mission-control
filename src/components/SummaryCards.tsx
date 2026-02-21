export type FilterKey = "total" | "deployed" | "developing" | "paused" | "urgent";

interface Stats {
  total: number;
  deployed: number;
  developing: number;
  paused: number;
  urgent: number;
}

const cards: { key: FilterKey; label: string; icon: string; color: string }[] = [
  { key: "total", label: "총 프로젝트", icon: "📦", color: "#8b5cf6" },
  { key: "deployed", label: "배포/운영", icon: "✅", color: "#22c55e" },
  { key: "developing", label: "개발 중", icon: "🔧", color: "#eab308" },
  { key: "paused", label: "일시정지", icon: "⏸️", color: "#6b7280" },
  { key: "urgent", label: "🚨 밀린 작업", icon: "", color: "#ef4444" },
];

export default function SummaryCards({
  stats,
  activeFilter,
  onFilter,
}: {
  stats: Stats;
  activeFilter: FilterKey | null;
  onFilter: (key: FilterKey | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      {cards.map((c) => {
        const isActive = activeFilter === c.key;
        const isUrgentHighlight = c.key === "urgent" && stats.urgent > 0;

        return (
          <button
            key={c.key}
            onClick={() => onFilter(isActive ? null : c.key)}
            className={`rounded-xl p-4 text-center transition-all cursor-pointer ${
              isActive
                ? "ring-2 ring-offset-1 ring-offset-[#0a0a12] bg-[#13131f]"
                : "bg-[#13131f] hover:bg-[#1a1a2e]"
            } ${
              isUrgentHighlight && !isActive
                ? "border border-[#ef4444]/50 bg-[#ef4444]/5"
                : isActive
                  ? ""
                  : "border border-[#1e1e30]"
            }`}
            style={isActive ? { borderColor: c.color, borderWidth: 2 } : {}}
          >
            {c.icon && <div className="text-2xl mb-1">{c.icon}</div>}
            <div
              className="text-3xl font-bold font-[var(--font-mono)]"
              style={{ color: c.color }}
            >
              {stats[c.key]}
            </div>
            <div className="text-sm text-[#a1a1aa] mt-1">{c.label}</div>
            {c.key === "urgent" && stats.urgent > 0 && (
              <div className="text-[10px] text-[#ef4444]/70 mt-1">
                개발중 5일+ 방치
              </div>
            )}
            {isActive && (
              <div className="text-[10px] mt-1" style={{ color: c.color }}>
                ▼ 필터 적용 중
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
