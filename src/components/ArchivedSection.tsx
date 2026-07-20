"use client";

import { useState } from "react";
import { Project } from "@/lib/types";

/** 보관됨(archived) 프로젝트 접이식 섹션 */
export default function ArchivedSection({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  if (!projects.length) return null;

  return (
    <section className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>📦 보관됨 {projects.length}개</span>
        <span className="text-[11px] text-[#52525b]">
          (폴더·배포 흔적 없음 — 되살리려면 상태 변경)
        </span>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {projects.map((p) => (
            <div
              key={p.slug}
              className="bg-[#0f0f16] border border-[#1a1a28] rounded-lg px-3 py-2 opacity-70"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#a1a1aa] truncate">{p.name}</span>
                <span className="text-[10px] text-[#52525b] shrink-0">
                  {(p as Project & { _prevStatus?: string })._prevStatus ?? ""}
                </span>
              </div>
              <p className="text-[11px] text-[#52525b] truncate mt-0.5">{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
