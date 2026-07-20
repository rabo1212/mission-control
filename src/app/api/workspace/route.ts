/**
 * 워크스페이스 파일 스캐너 API — ~/ 홈 폴더의 개발중 프로젝트 자동 감지
 * GET /api/workspace → 프로젝트 폴더 목록(git/package.json/py 감지 + 최근수정 + 스택)
 *
 * "개발중" 판별: package.json / .git / *.py / requirements.txt 중 하나라도 있으면 프로젝트.
 * 최근 수정순 정렬. 노이즈(Library, Downloads 등 시스템/비프로젝트) 제외.
 */
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const HOME = os.homedir();
const SKIP = new Set([
  "Library", "Downloads", "Desktop", "Documents", "Movies", "Music", "Pictures",
  "Public", "Applications", "Movies", ".Trash", "go", "node_modules",
  ".hermes", ".claude", ".cache", ".npm", ".cursor", ".vscode", ".config",
  "My_vault", ".ssh", ".gnupg",
]);

interface WsProject {
  name: string;
  path: string;
  kind: string[];      // ["node","git","python"]
  stack: string[];     // 주요 의존성/언어
  mtime: number;
  hasReadme: boolean;
}

function detectStack(dir: string, kind: string[]): string[] {
  const stack: string[] = [];
  try {
    if (kind.includes("node")) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const known = ["next", "react", "vue", "svelte", "express", "vite", "tailwindcss", "typescript", "electron"];
      for (const k of known) if (deps[k]) stack.push(k === "next" ? "Next.js" : k);
    }
  } catch {}
  if (kind.includes("python")) stack.push("Python");
  return [...new Set(stack)].slice(0, 5);
}

export async function GET() {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(HOME, { withFileTypes: true });
  } catch {
    return NextResponse.json({ error: "홈 스캔 실패" }, { status: 500 });
  }

  const projects: WsProject[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".") || SKIP.has(e.name)) continue;
    const dir = path.join(HOME, e.name);
    let files: string[];
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    const kind: string[] = [];
    if (files.includes("package.json")) kind.push("node");
    if (files.includes(".git")) kind.push("git");
    if (files.includes("requirements.txt") || files.includes("pyproject.toml") ||
        files.some((f) => f.endsWith(".py"))) kind.push("python");

    if (kind.length === 0) continue; // 프로젝트 아님

    let mtime = 0;
    try {
      mtime = fs.statSync(dir).mtimeMs;
      // src나 주요 파일의 최근 수정으로 보정
      for (const probe of ["src", "app", "package.json", "main.py"]) {
        const p = path.join(dir, probe);
        if (fs.existsSync(p)) {
          const m = fs.statSync(p).mtimeMs;
          if (m > mtime) mtime = m;
        }
      }
    } catch {}

    projects.push({
      name: e.name,
      path: dir,
      kind,
      stack: detectStack(dir, kind),
      mtime,
      hasReadme: files.some((f) => /^readme\.md$/i.test(f)),
    });
  }

  projects.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json({ ok: true, home: HOME, count: projects.length, projects });
}
