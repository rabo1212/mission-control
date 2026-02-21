import { Project, STATUS_CONFIG } from "@/lib/types";

interface TimelineEntry {
  date: string;
  text: string;
  projectName: string;
  status: string;
}

function collectTimeline(projects: Project[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const p of projects) {
    if (!p.activities) continue;
    for (const a of p.activities) {
      entries.push({
        date: a.date,
        text: a.text,
        projectName: p.name,
        status: a.status,
      });
    }
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries.slice(0, 15);
}

function groupByDate(entries: TimelineEntry[]) {
  const groups: Record<string, TimelineEntry[]> = {};
  for (const e of entries) {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  }
  return groups;
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "오늘";
  if (dateStr === yesterday) return "어제";

  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function Timeline({ projects }: { projects: Project[] }) {
  const entries = collectTimeline(projects);
  const groups = groupByDate(entries);

  if (!entries.length) {
    return <p className="text-sm text-[#a1a1aa]">활동 내역이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([date, items]) => (
        <div key={date}>
          <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
            📅 {formatDate(date)} ({date})
          </h4>
          <div className="space-y-1.5 pl-2 border-l border-[#1e1e30]">
            {items.map((item, i) => {
              const cfg =
                STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={i} className="flex items-start gap-2 pl-3">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: cfg?.color ?? "#6b7280" }}
                  />
                  <span className="text-sm">
                    <span className="text-[#a1a1aa]">{item.projectName}</span>
                    {" — "}
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
