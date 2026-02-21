interface Stats {
  total: number;
  deployed: number;
  developing: number;
  paused: number;
  urgent: number;
}

const cards = [
  { key: "total" as const, label: "총 프로젝트", icon: "📦", color: "#8b5cf6" },
  { key: "deployed" as const, label: "배포/운영", icon: "✅", color: "#22c55e" },
  { key: "developing" as const, label: "개발 중", icon: "🔧", color: "#eab308" },
  { key: "paused" as const, label: "일시정지", icon: "⏸️", color: "#6b7280" },
  { key: "urgent" as const, label: "🚨 밀린 작업", icon: "", color: "#ef4444" },
];

export default function SummaryCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      {cards.map((c) => (
        <div
          key={c.key}
          className={`bg-[#13131f] border rounded-xl p-4 text-center ${
            c.key === "urgent" && stats.urgent > 0
              ? "border-[#ef4444]/50 bg-[#ef4444]/5"
              : "border-[#1e1e30]"
          }`}
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
        </div>
      ))}
    </div>
  );
}
