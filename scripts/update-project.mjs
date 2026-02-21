#!/usr/bin/env node
/**
 * 미션 컨트롤 프로젝트 업데이트 스크립트
 *
 * 사용법:
 *   node /Users/labo/mission-control/scripts/update-project.mjs \
 *     --slug chunmyeong \
 *     --activity "Phase 4 프리미엄 결제 구현 완료" \
 *     --status deployed \
 *     --todo-done "결제 E2E 테스트" \
 *     --todo-add "마케팅 시작" \
 *     --push
 *
 * 필수: --slug, --activity
 * 선택: --status, --todo-done (완료처리), --todo-add (추가), --push (git push)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const DATA_PATH = path.join("/Users/labo/mission-control", "data", "projects.json");

// 인자 파싱
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  if (name === "push") return true; // 플래그
  return args[idx + 1] || null;
}
function getAllArgs(name) {
  const results = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}` && args[i + 1]) {
      results.push(args[i + 1]);
    }
  }
  return results;
}

const slug = getArg("slug");
const activity = getArg("activity");
const status = getArg("status");
const todoDone = getAllArgs("todo-done");
const todoAdd = getAllArgs("todo-add");
const shouldPush = getArg("push");

if (!slug || !activity) {
  console.error("❌ 필수: --slug <프로젝트slug> --activity <활동내용>");
  console.error("");
  console.error("예시:");
  console.error('  node update-project.mjs --slug chunmyeong --activity "버그 수정" --push');
  console.error('  node update-project.mjs --slug polybot --activity "v4 실전 투입" --status running --push');
  process.exit(1);
}

// projects.json 읽기
const projects = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
const project = projects.find((p) => p.slug === slug);

if (!project) {
  console.error(`❌ 프로젝트 "${slug}" 을 찾을 수 없습니다.`);
  console.error("등록된 slug 목록:");
  projects.forEach((p) => console.error(`  - ${p.slug} (${p.name})`));
  process.exit(1);
}

const today = new Date().toISOString().split("T")[0];
const oldStatus = project.status;

// 1) 활동 로그 추가 (맨 앞에)
if (!project.activities) project.activities = [];
project.activities.unshift({
  date: today,
  text: activity,
  status: status || project.status,
});

// 2) 상태 변경
if (status) {
  project.status = status;
}

// 3) 할 일 완료 처리 (제거)
if (todoDone.length && project.todos) {
  project.todos = project.todos.filter((t) => !todoDone.includes(t));
}

// 4) 할 일 추가
if (todoAdd.length) {
  if (!project.todos) project.todos = [];
  for (const t of todoAdd) {
    if (!project.todos.includes(t)) project.todos.push(t);
  }
}

// 저장
fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2) + "\n", "utf-8");

// 결과 출력
console.log(`✅ ${project.name} 업데이트 완료!`);
console.log(`   활동: ${activity}`);
if (status && status !== oldStatus) console.log(`   상태: ${oldStatus} → ${status}`);
if (todoDone.length) console.log(`   할일 완료: ${todoDone.join(", ")}`);
if (todoAdd.length) console.log(`   할일 추가: ${todoAdd.join(", ")}`);

// git commit + push
if (shouldPush) {
  try {
    const mcDir = "/Users/labo/mission-control";
    execSync(`git -C "${mcDir}" add data/projects.json`);
    execSync(`git -C "${mcDir}" commit -m "update: ${project.name} — ${activity}"`, {
      env: { ...process.env },
    });
    execSync(`git -C "${mcDir}" push`);
    console.log("   🚀 git push 완료 → Vercel 자동 배포됨");
  } catch (e) {
    console.error("   ⚠️ git push 실패:", e.message);
  }
}
