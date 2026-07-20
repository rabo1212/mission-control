/**
 * 노트 API — 옵시디언 볼트(~/My_vault) md 브라우저
 * GET /api/notes                    → 폴더 트리 + md 파일 목록
 * GET /api/notes?path=<rel>         → 특정 md 파일 내용(마크다운 원문)
 * GET /api/notes?q=<검색어>          → 파일명/본문 검색(최대 60)
 *
 * 볼트 밖 경로 접근 차단(경로 탈출 방지).
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
const execFileP = promisify(execFile);

const VAULT = process.env.VAULT_PATH || path.join(os.homedir(), "My_vault");
const IGNORE = new Set([".obsidian", ".git", "node_modules", ".trash", ".DS_Store"]);

function safeResolve(rel: string): string | null {
  const target = path.resolve(VAULT, rel);
  if (target !== VAULT && !target.startsWith(VAULT + path.sep)) return null;
  return target;
}

interface TreeNode {
  name: string;
  path: string; // vault-relative
  type: "dir" | "file";
  children?: TreeNode[];
  mtime?: number;
}

function buildTree(dir: string, rel = "", depth = 0): TreeNode[] {
  if (depth > 4) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nodes: TreeNode[] = [];
  for (const e of entries) {
    if (IGNORE.has(e.name) || e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    const r = path.join(rel, e.name);
    if (e.isDirectory()) {
      const children = buildTree(abs, r, depth + 1);
      // md가 하나도 없는 폴더는 스킵
      if (children.length > 0) {
        nodes.push({ name: e.name, path: r, type: "dir", children });
      }
    } else if (e.name.endsWith(".md")) {
      let mtime = 0;
      try {
        mtime = fs.statSync(abs).mtimeMs;
      } catch {}
      nodes.push({ name: e.name.replace(/\.md$/, ""), path: r, type: "file", mtime });
    }
  }
  // 폴더 먼저, 그 안에서 이름순 / 파일은 최근수정순
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    if (a.type === "file") return (b.mtime ?? 0) - (a.mtime ?? 0);
    return a.name.localeCompare(b.name, "ko");
  });
  return nodes;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  const q = searchParams.get("q");

  // 단일 파일 내용
  if (filePath) {
    const abs = safeResolve(filePath);
    if (!abs || !abs.endsWith(".md")) {
      return NextResponse.json({ error: "잘못된 경로" }, { status: 400 });
    }
    try {
      const content = fs.readFileSync(abs, "utf-8");
      const stat = fs.statSync(abs);
      return NextResponse.json({
        ok: true,
        path: filePath,
        content: content.slice(0, 200_000),
        mtime: stat.mtimeMs,
        size: stat.size,
      });
    } catch {
      return NextResponse.json({ error: "읽기 실패" }, { status: 404 });
    }
  }

  // 검색 (ripgrep 있으면 본문, 없으면 파일명)
  if (q && q.trim()) {
    const term = q.trim();
    try {
      const { stdout } = await execFileP(
        "rg",
        ["-l", "-i", "--type", "md", "-m", "1", "--max-count", "1", term, VAULT],
        { timeout: 8000, maxBuffer: 4 * 1024 * 1024 }
      );
      const files = stdout
        .split("\n")
        .filter(Boolean)
        .map((abs) => path.relative(VAULT, abs))
        .filter((r) => !r.split(path.sep).some((seg) => IGNORE.has(seg)))
        .slice(0, 60)
        .map((r) => ({ name: path.basename(r, ".md"), path: r }));
      return NextResponse.json({ ok: true, mode: "search", query: term, files });
    } catch {
      // rg 실패 → 파일명 fallback은 트리에서 처리하므로 빈 결과
      return NextResponse.json({ ok: true, mode: "search", query: term, files: [] });
    }
  }

  // 전체 트리
  try {
    const tree = buildTree(VAULT);
    return NextResponse.json({ ok: true, vault: VAULT, tree });
  } catch {
    return NextResponse.json({ error: "볼트 스캔 실패", vault: VAULT }, { status: 500 });
  }
}
