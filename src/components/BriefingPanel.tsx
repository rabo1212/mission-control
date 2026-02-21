"use client";

import { useState } from "react";

export default function BriefingPanel({
  briefingText,
}: {
  briefingText: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefingText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = briefingText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">
          클코 브리핑
        </h3>
        <button
          onClick={handleCopy}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            copied
              ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
              : "bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/30"
          }`}
        >
          {copied ? "✅ 복사됨!" : "📋 복사하기"}
        </button>
      </div>
      <pre className="text-sm text-[#a1a1aa] font-[var(--font-mono)] whitespace-pre-wrap bg-[#0a0a12] rounded-lg p-4 border border-[#1e1e30] max-h-80 overflow-y-auto leading-relaxed">
        {briefingText}
      </pre>
    </div>
  );
}
