"use client";

import { useState, useEffect } from "react";
import PetHouse from "./PetHouse";

/**
 * 봇의 '일하는 중' 상태 + 무슨 일인지 추정:
 * - 크론 잡이 임박(15분 내)하거나 방금 실행(10분 내)됐으면 담당 봇이 일하는 중
 * - 크론 이름으로 담당 봇 매핑 (레딧/브리핑/슬랙 = 페페(slack2))
 * - 페페가 이 대시보드 챗으로 최근 대화중이면(localStorage 신호) 페페 일하는 중
 * - workingJobs: 프로필 → 짧은 작업 라벨 (말풍선 "○○ 하는중!" 용)
 */
function ownerProfile(jobName: string): string | null {
  const n = jobName.toLowerCase();
  if (n.includes("레딧") || n.includes("브리핑") || n.includes("슬랙") || n.includes("reddit")) return "slack2";
  // 필요시 비르/조니 담당 잡 추가 매핑
  return "slack2"; // 기본은 페페(총괄)
}

// 크론 이름 → 짧은 라벨 (말풍선에 "라벨 하는중!"으로 뜸)
function shortLabel(jobName: string): string {
  const n = jobName.toLowerCase();
  if (n.includes("주간 정리") || (n.includes("슬랙") && n.includes("정리"))) return "슬랙 정리";
  if (n.includes("주간 취합") || n.includes("프로토타입")) return "레딧 주간취합";
  if (n.includes("피드백")) return "피드백 처리";
  if (n.includes("레딧")) return "레딧 분석";
  if (n.includes("브리핑")) return "브리핑 작성";
  // 기본: 앞 8글자
  return jobName.length > 10 ? jobName.slice(0, 10) : jobName;
}

export default function PetHouseWrapper() {
  const [workingJobs, setWorkingJobs] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const cron = await fetch("/api/cron").then((r) => r.json()).catch(() => null);
        const jobs: Record<string, string> = {};
        const now = Date.now();
        // 임박한(곧 실행될) 잡을 우선, 그 다음 방금 실행된 잡
        const candidates: { name: string; when: number }[] = [];
        if (cron?.jobs) {
          for (const j of cron.jobs) {
            if (j.nextRun) {
              const diff = new Date(j.nextRun).getTime() - now;
              if (diff > 0 && diff < 15 * 60 * 1000) candidates.push({ name: j.name, when: diff });
            }
            if (j.lastRun) {
              const ago = now - new Date(j.lastRun).getTime();
              if (ago > 0 && ago < 10 * 60 * 1000) candidates.push({ name: j.name, when: ago });
            }
          }
        }
        // 가장 임박/최근 순으로 정렬해서 프로필별 대표 작업 하나씩
        candidates.sort((a, b) => a.when - b.when);
        for (const c of candidates) {
          const p = ownerProfile(c.name);
          if (p && !jobs[p]) jobs[p] = shortLabel(c.name);
        }
        // 페페 챗 최근 사용 신호(대시보드에서 방금 대화)
        try {
          const last = Number(localStorage.getItem("pepe_last_chat") || 0);
          if (last && now - last < 5 * 60 * 1000 && !jobs["slack2"]) jobs["slack2"] = "대장이랑 대화";
        } catch {}

        if (alive) setWorkingJobs(jobs);
      } catch {}
    };
    load();
    const iv = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  return <PetHouse workingJobs={workingJobs} />;
}
