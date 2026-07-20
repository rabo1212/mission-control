"use client";

import { useState, useEffect, useCallback } from "react";
import { renderMarkdown } from "@/lib/markdown";

interface TreeNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: TreeNode[];
  mtime?: number;
}
interface WsProject {
  name: string;
  path: string;
  kind: string[];
  stack: string[];
  mtime: number;
  hasReadme: boolean;
}

function timeAgo(ms: number): string {
  const d = (Date.now() - ms) / 86400000;
  if (d < 1) return "오늘";
  if (d < 2) return "어제";
  if (d < 30) return `${Math.floor(d)}일 전`;
  return `${Math.floor(d / 30)}개월 전`;
}

function TreeItem({
  node,
  onOpen,
  active,
  depth = 0,
}: {
  node: TreeNode;
  onOpen: (p: string) => void;
  active: string | null;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  if (node.type === "file") {
    return (
      <button
        onClick={() => onOpen(node.path)}
        className={`w-full text-left truncate px-2 py-1 rounded text-xs transition-colors ${
          active === node.path
            ? "bg-[#8b5cf6] text-white"
            : "text-[#a1a1aa] hover:bg-[#1e1e30] hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.name}
      >
        📄 {node.name}
      </button>
    );
  }
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left truncate px-2 py-1 rounded text-xs font-medium text-[#e4e4e7] hover:bg-[#1e1e30]"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {open ? "▾" : "▸"} {node.name}
        <span className="text-[#52525b] ml-1">
          {node.children?.filter((c) => c.type === "file").length || ""}
        </span>
      </button>
      {open &&
        node.children?.map((c) => (
          <TreeItem key={c.path} node={c} onOpen={onOpen} active={active} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function WorkspaceClient() {
  const [view, setView] = useState<"notes" | "projects">("notes");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [projects, setProjects] = useState<WsProject[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [noteLoading, setNoteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; path: string }[] | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [n, w] = await Promise.all([
          fetch("/api/notes").then((r) => r.json()),
          fetch("/api/workspace").then((r) => r.json()),
        ]);
        if (n.ok) setTree(n.tree);
        if (w.ok) setProjects(w.projects);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const openNote = useCallback(async (path: string) => {
    setActivePath(path);
    setNoteLoading(true);
    setContent("");
    try {
      const r = await fetch(`/api/notes?path=${encodeURIComponent(path)}`).then((x) => x.json());
      if (r.ok) setContent(r.content);
      else setContent("*(읽기 실패)*");
    } catch {
      setContent("*(연결 실패)*");
    }
    setNoteLoading(false);
  }, []);

  const runSearch = useCallback(async () => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    try {
      const r = await fetch(`/api/notes?q=${encodeURIComponent(q)}`).then((x) => x.json());
      setSearchResults(r.files || []);
    } catch {
      setSearchResults([]);
    }
  }, [search]);

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] sm:h-[calc(100vh-140px)]">
      <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4">
        <h1 className="text-lg sm:text-xl font-bold">🗂️ 워크스페이스</h1>
        <div className="flex gap-1 bg-[#13131f] rounded-lg p-1 border border-[#1e1e30]">
          <button
            onClick={() => setView("notes")}
            className={`px-3 py-1 rounded text-xs font-medium ${view === "notes" ? "bg-[#8b5cf6] text-white" : "text-[#a1a1aa]"}`}
          >
            📓 노트 ({tree.reduce((a, n) => a + countFiles(n), 0)})
          </button>
          <button
            onClick={() => setView("projects")}
            className={`px-3 py-1 rounded text-xs font-medium ${view === "projects" ? "bg-[#8b5cf6] text-white" : "text-[#a1a1aa]"}`}
          >
            💻 개발중 ({projects.length})
          </button>
        </div>
        <span className="hidden sm:inline text-xs text-[#52525b]">옵시디언 볼트 · ~/My_vault</span>
      </div>

      {loading ? (
        <div className="text-[#a1a1aa] text-sm">불러오는 중…</div>
      ) : view === "notes" ? (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 min-h-0">
          {/* 좌(폰:상): 트리 + 검색 */}
          <div className="w-full sm:w-72 shrink-0 flex flex-col bg-[#13131f] border border-[#1e1e30] rounded-xl overflow-hidden max-h-52 sm:max-h-none">
            <div className="p-2 border-b border-[#1e1e30]">
              <div className="flex gap-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="본문 검색…"
                  className="flex-1 bg-[#0f0f1a] border border-[#2a2a45] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#8b5cf6]"
                />
                {searchResults !== null && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSearchResults(null);
                    }}
                    className="text-xs text-[#a1a1aa] px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {searchResults !== null
                ? searchResults.length === 0
                  ? <div className="text-xs text-[#52525b] p-2">결과 없음</div>
                  : searchResults.map((f) => (
                      <button
                        key={f.path}
                        onClick={() => openNote(f.path)}
                        className={`w-full text-left truncate px-2 py-1 rounded text-xs ${activePath === f.path ? "bg-[#8b5cf6] text-white" : "text-[#a1a1aa] hover:bg-[#1e1e30]"}`}
                        title={f.path}
                      >
                        📄 {f.name}
                      </button>
                    ))
                : tree.map((n) => (
                    <TreeItem key={n.path} node={n} onOpen={openNote} active={activePath} />
                  ))}
            </div>
          </div>

          {/* 우: 뷰어 */}
          <div className="flex-1 min-w-0 bg-[#13131f] border border-[#1e1e30] rounded-xl overflow-hidden flex flex-col">
            {activePath ? (
              <>
                <div className="px-4 py-2 border-b border-[#1e1e30] text-xs text-[#a1a1aa] truncate">
                  {activePath}
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {noteLoading ? (
                    <div className="text-[#a1a1aa] text-sm">노트 여는 중…</div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#52525b] text-sm">
                왼쪽에서 노트를 선택하세요
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 개발중 프로젝트 */
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <div
                key={p.path}
                className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-4 hover:border-[#8b5cf6]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                  <span className="text-[10px] text-[#52525b] shrink-0 ml-2">{timeAgo(p.mtime)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.kind.map((k) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e30] text-[#a1a1aa]">
                      {k === "node" ? "⬢ node" : k === "git" ? "⎇ git" : "🐍 py"}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.stack.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#c4b5fd]">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-[#52525b] mt-2 truncate font-[var(--font-mono)]">{p.path}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function countFiles(n: TreeNode): number {
  if (n.type === "file") return 1;
  return (n.children || []).reduce((a, c) => a + countFiles(c), 0);
}
