"use client";

import { useSSE } from "@/hooks/useSSE";

export default function LiveIndicator() {
  const { connected } = useSSE();

  return (
    <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-[#22c55e] animate-pulse" : "bg-[#ef4444]"
        }`}
      />
      <span>{connected ? "LIVE" : "OFFLINE"}</span>
    </div>
  );
}
