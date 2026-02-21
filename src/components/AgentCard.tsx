import { Agent } from "@/lib/types";

export default function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5 hover:border-[#8b5cf6]/40 transition-colors group">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{agent.emoji}</span>
        <div>
          <h3 className="font-bold text-sm group-hover:text-[#8b5cf6] transition-colors">
            {agent.name}
          </h3>
          <span className="text-xs text-[#a1a1aa]">{agent.role}</span>
        </div>
        <span
          className={`ml-auto w-2 h-2 rounded-full ${
            agent.status === "active" ? "bg-[#22c55e]" : "bg-[#6b7280]"
          }`}
        />
      </div>
      <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed">
        {agent.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="text-xs px-2 py-0.5 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6]/80 border border-[#8b5cf6]/20"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
