import TokenPanel from "@/components/TokenPanel";

export default function TokensPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          💰 <span>토큰 / 비용 트래킹</span>
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          API 호출량, 토큰 소모량, 비용 현황
        </p>
      </header>

      <TokenPanel />

      {/* 데이터 출처 설명 */}
      <section className="mt-8 bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#a1a1aa] mb-2">📊 데이터 출처</h3>
        <p className="text-xs text-[#71717a] leading-relaxed">
          이 수치는 <span className="text-[#22c55e]">실제 hermes 세션 DB</span>(<code className="text-[#a1a1aa]">~/.hermes/state.db</code>의 <code className="text-[#a1a1aa]">sessions</code> 테이블)에서
          집계돼. <code className="text-[#a1a1aa]">hermes insights</code> 명령과 동일한 원천이라, 데스크탑·TUI·CLI·서브에이전트·슬랙·크론 등
          모든 경로의 실제 토큰 소모량이 자동 반영돼. 비용은 가격표가 등록된 모델(opus 등)만 추정치로 표시돼 —
          가격 미등록 모델은 토큰만 집계되고 비용은 0으로 나올 수 있어.
        </p>
      </section>
    </>
  );
}
