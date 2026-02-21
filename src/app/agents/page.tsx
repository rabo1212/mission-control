import { getAgents } from "@/lib/data";
import AgentCard from "@/components/AgentCard";

export default function AgentsPage() {
  const agents = getAgents();
  const active = agents.filter((a) => a.status === "active").length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🦞 <span>가재군단</span>
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          AI 에이전트 {agents.length}마리 · 활성 {active}마리
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </>
  );
}
