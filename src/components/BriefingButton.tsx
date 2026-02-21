"use client";

import { useState } from "react";

export default function BriefingButton({
  briefingText,
}: {
  briefingText: string;
}) {
  const [state, setState] = useState<"idle" | "preview" | "copied">("idle");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (state === "preview") {
      // copy
      navigator.clipboard.writeText(briefingText).then(() => {
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      });
    } else {
      setState("preview");
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
          state === "copied"
            ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
            : state === "preview"
              ? "bg-[#8b5cf6]/30 text-[#8b5cf6] border border-[#8b5cf6]/50"
              : "bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/25"
        }`}
      >
        {state === "copied"
          ? "✅ 복사됨!"
          : state === "preview"
            ? "📋 복사하기"
            : "⚡ 브리핑"}
      </button>

      {state === "preview" && (
        <div
          className="absolute bottom-full right-0 mb-2 w-72 bg-[#0a0a12] border border-[#8b5cf6]/30 rounded-xl p-3 shadow-2xl shadow-black/50 z-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8b5cf6]">
              클코 브리핑 미리보기
            </span>
            <button
              onClick={handleClose}
              className="text-[#a1a1aa] hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <pre className="text-[10px] text-[#a1a1aa] font-[var(--font-mono)] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed bg-[#13131f] rounded-lg p-2 border border-[#1e1e30]">
            {briefingText}
          </pre>
          <p className="text-[10px] text-[#a1a1aa] mt-2 text-center">
            위 [📋 복사하기] 버튼을 누르세요
          </p>
        </div>
      )}
    </div>
  );
}
