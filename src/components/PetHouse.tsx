"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type PetId = "pepe" | "vir" | "johnny";
type Activity = "idle" | "walk" | "sleep" | "work";

interface Pet {
  id: PetId;
  name: string;
  profile: string;
  role: string;
  scale: number; // 크기 배율 (실물 반영: 비르<페페<조니)
}

const PETS: Pet[] = [
  { id: "vir", name: "비르", profile: "publisher", role: "콘텐츠·리서치", scale: 0.82 },
  { id: "pepe", name: "페페", profile: "slack2", role: "총괄비서", scale: 1.0 },
  { id: "johnny", name: "조니", profile: "studio-ops", role: "이미지·스튜디오", scale: 1.22 },
];

const PET_MAP = Object.fromEntries(PETS.map((p) => [p.id, p])) as Record<PetId, Pet>;

// 방 전체 바닥 영역 — 다 같이 자유롭게 돌아다님
const FLOOR = { minX: 10, maxX: 84, minY: 55, maxY: 85 };

// 낮잠 스팟(공용) — 가까운 빈 자리로 감
const SLEEP_SPOTS = [
  { x: 16, y: 44 },  // 캣타워
  { x: 40, y: 54 },  // 중앙 쿠션
  { x: 74, y: 78 },  // 오른쪽 러그
];

const SPOTS = {
  desk: { x: 68, y: 60 }, // 일할 때만
};

const MIN_GAP = 21; // 서로 이 거리보다 가까운 목적지는 피함(부딪힘 방지, 캐릭터 크기 고려)

interface PetState {
  x: number;
  y: number;
  facing: 1 | -1;
  activity: Activity;
  bubble?: string;
}

const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2);

function poseSrc(id: PetId, activity: Activity): string {
  if (activity === "sleep") return `/pets/${id}_sleep.png`;
  if (activity === "work") return `/pets/${id}_work.png`;
  return `/pets/${id}.png`;
}

// 클릭 시 랜덤 대사 (순둥이 일상 톤)
const GREETINGS: Record<PetId, string[]> = {
  pepe: ["대장! 왔어? ㅎㅎ", "냐앙~ 보고싶었어", "그르릉 😽", "심심했는데 잘됐다", "쓰담쓰담 해줘"],
  vir: ["대장~ 안녕", "그르릉... 졸려", "냐옹 😺", "여기 앉아있었어", "왔구나 ㅎㅎ"],
  johnny: ["대장 왔어? ㅋㅋ", "냐앙— 배고파", "느긋하게 쉬는 중", "왔구나~ 반가워", "골골골 😸"],
};

export default function PetHouse({ workingJobs }: { workingJobs: Record<string, string> }) {
  const [states, setStates] = useState<Record<PetId, PetState>>(() => {
    const init = {} as Record<PetId, PetState>;
    const spread: Record<PetId, { x: number; y: number }> = {
      vir: { x: 22, y: 70 },
      pepe: { x: 44, y: 80 },
      johnny: { x: 66, y: 72 },
    };
    PETS.forEach((p) => {
      init[p.id] = { ...spread[p.id], facing: 1, activity: "idle" };
    });
    return init;
  });

  const [chatPet, setChatPet] = useState<PetId | null>(null);
  const workingRef = useRef(workingJobs);
  workingRef.current = workingJobs;
  const statesRef = useRef(states);
  statesRef.current = states;
  const roomRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<PetId | null>(null);
  const dragMovedRef = useRef(false);

  // 클릭 랜덤 대사 (미니 말풍선)
  const speak = useCallback((id: PetId) => {
    const lines = GREETINGS[id];
    const line = lines[Math.floor(Math.random() * lines.length)];
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], bubble: line } }));
    setTimeout(() => {
      setStates((prev) => (prev[id].bubble === line ? { ...prev, [id]: { ...prev[id], bubble: undefined } } : prev));
    }, 2600);
  }, []);

  // ── 드래그로 옮기기 ──
  const onPetPointerDown = useCallback((e: React.PointerEvent, id: PetId) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = id;
    dragMovedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    // 드래그 시작 → 자동배회/이동 애니메이션 끄고 idle로 고정
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], activity: "idle", bubble: undefined } }));
  }, []);

  const onPetPointerMove = useCallback((e: React.PointerEvent) => {
    const id = draggingRef.current;
    const room = roomRef.current;
    if (!id || !room) return;
    const rect = room.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    dragMovedRef.current = true;
    // 방 안으로 클램프
    const cx = Math.max(6, Math.min(94, x));
    const cy = Math.max(30, Math.min(94, y));
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], x: cx, y: cy, activity: "idle" } }));
  }, []);

  const onPetPointerUp = useCallback((e: React.PointerEvent, id: PetId) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    const moved = dragMovedRef.current;
    draggingRef.current = null;
    // 거의 안 움직였으면 = 클릭으로 간주 → 말걸기
    if (!moved) speak(id);
    dragMovedRef.current = false;
  }, [speak]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // 목적지가 다른 고양이(현재 위치 or 이동 목적지)와 너무 가까운지
    function occupied(x: number, y: number, self: PetId) {
      return PETS.some((p) => p.id !== self && dist(x, y, statesRef.current[p.id].x, statesRef.current[p.id].y) < MIN_GAP);
    }
    // 방 전체 어디든 자유롭게, 단 다른 애랑 겹치는 자리만 피함
    function pickFreeSpot(self: PetId) {
      for (let i = 0; i < 15; i++) {
        const x = rand(FLOOR.minX, FLOOR.maxX), y = rand(FLOOR.minY, FLOOR.maxY);
        if (!occupied(x, y, self)) return { x, y };
      }
      // 못 찾으면 그냥 랜덤(드묾)
      return { x: rand(FLOOR.minX, FLOOR.maxX), y: rand(FLOOR.minY, FLOOR.maxY) };
    }
    // 비어있는 낮잠 스팟 하나 고르기(다른 애가 없는 곳)
    function pickSleepSpot(self: PetId) {
      const free = SLEEP_SPOTS.filter((s) => !occupied(s.x, s.y, self));
      const pool = free.length ? free : SLEEP_SPOTS;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    function scheduleNext(pet: Pet) {
      const delay = rand(3000, 7000);
      const t = setTimeout(() => {
        setStates((prev) => {
          const cur = prev[pet.id];
          // 드래그 중인 애는 자동 이동/행동 스킵 (대장이 옮기는 중)
          if (draggingRef.current === pet.id) return prev;
          const jobLabel = workingRef.current[pet.profile];
          const working = !!jobLabel;
          let next: PetState;
          if (working) {
            const atDesk = dist(cur.x, cur.y, SPOTS.desk.x, SPOTS.desk.y) < 7;
            next = atDesk
              ? { ...cur, activity: "work", bubble: `${jobLabel} 하는중!`, facing: 1 }
              : { ...cur, x: SPOTS.desk.x, y: SPOTS.desk.y, facing: SPOTS.desk.x > cur.x ? 1 : -1, activity: "walk", bubble: undefined };
          } else {
            const roll = Math.random();
            if (cur.activity === "walk") {
              // 낮잠 스팟 근처에 도착했으면 잘 수도
              const nearSleep = SLEEP_SPOTS.some((s) => dist(cur.x, cur.y, s.x, s.y) < 8);
              next = nearSleep && Math.random() < 0.6
                ? { ...cur, activity: "sleep", bubble: "z" }
                : { ...cur, activity: "idle", bubble: Math.random() < 0.25 ? pickBubble("idle") : undefined };
            } else if (cur.activity === "sleep") {
              next = Math.random() < 0.4 ? { ...cur, activity: "idle", bubble: undefined } : { ...cur, activity: "sleep", bubble: "z" };
            } else if (roll < 0.55) {
              // 방 전체 자유 배회
              const spot = pickFreeSpot(pet.id);
              next = { ...cur, x: spot.x, y: spot.y, facing: spot.x > cur.x ? 1 : -1, activity: "walk", bubble: undefined };
            } else if (roll < 0.8) {
              // 빈 낮잠 스팟으로
              const spot = pickSleepSpot(pet.id);
              next = { ...cur, x: spot.x, y: spot.y, facing: spot.x > cur.x ? 1 : -1, activity: "walk", bubble: undefined };
            } else {
              next = { ...cur, activity: "idle", bubble: Math.random() < 0.3 ? pickBubble("idle") : undefined };
            }
          }
          return { ...prev, [pet.id]: next };
        });
        scheduleNext(pet);
      }, delay);
      timers.push(t);
    }
    PETS.forEach(scheduleNext);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <div ref={roomRef} className="relative w-full rounded-2xl overflow-hidden border border-[#1e1e30] bg-[#f5f0e6]" style={{ aspectRatio: "3 / 2" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pets/room.png" alt="펫 하우스" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: "pixelated" }} />

        {PETS.map((pet) => {
          const s = states[pet.id];
          const moving = s.activity === "walk";
          const isDragging = draggingRef.current === pet.id;
          const animName = s.activity === "walk" ? "petBob" : s.activity === "sleep" ? "petSleep" : s.activity === "work" ? "petWork" : "petIdle";
          const animDur = s.activity === "walk" ? "0.45s" : s.activity === "work" ? "0.9s" : "3.2s";
          return (
            <div
              key={pet.id}
              className="absolute cursor-grab active:cursor-grabbing group touch-none"
              onPointerDown={(e) => onPetPointerDown(e, pet.id)}
              onPointerMove={onPetPointerMove}
              onPointerUp={(e) => onPetPointerUp(e, pet.id)}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${13 * pet.scale}%`,
                transform: "translate(-50%, -78%)",
                transition: isDragging ? "none" : moving ? "left 3s linear, top 3s linear" : "none",
                zIndex: isDragging ? 50 : Math.round(s.y),
              }}
            >
              {s.bubble && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-white/95 text-[#333] px-2 py-0.5 rounded-full border border-black/10 shadow-sm z-20">
                  {s.bubble === "z" ? "💤" : s.bubble}
                </div>
              )}
              <div style={{ animation: `${animName} ${animDur} ease-in-out infinite`, filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.25))" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={poseSrc(pet.id, s.activity)}
                  alt={pet.name}
                  className="w-full h-auto select-none pointer-events-none group-hover:brightness-110 transition"
                  style={{ imageRendering: "pixelated", transform: `scaleX(${s.facing})` }}
                />
              </div>
              {s.activity === "work" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white bg-black/45 px-1.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                  💻
                </div>
              )}
              {/* 대화 버튼 (호버 시) — 드래그와 충돌 방지 위해 pointerdown 격리 */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setChatPet(pet.id); }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[9px] bg-[#8b5cf6] text-white px-2 py-0.5 rounded-full whitespace-nowrap z-30"
              >
                💬 대화
              </button>
            </div>
          );
        })}

        <div className="absolute top-2 right-2 text-[10px] text-[#555] bg-white/70 rounded-lg px-2 py-1 leading-relaxed">
          클릭=말걸기 · 드래그=옮기기 · 💬=대화 · 일 있으면 책상💻
        </div>

        <style>{`
          @keyframes petBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
          @keyframes petIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
          @keyframes petSleep { 0%,100%{transform:scale(1,1)} 50%{transform:scale(1.03,0.96)} }
          @keyframes petWork { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-1.5px) rotate(-2deg)} 75%{transform:translateY(-1.5px) rotate(2deg)} }
        `}</style>
      </div>

      {/* 고양이별 챗창 */}
      {chatPet && <PetChat pet={PET_MAP[chatPet]} onClose={() => setChatPet(null)} />}
    </>
  );
}

function pickBubble(a: Activity): string {
  const idle = ["냥", "😺", "야옹", "심심~", "그르릉"];
  const work = ["집중!", "일하는 중", "💻", "🔥", "타닥타닥"];
  const pool = a === "work" ? work : idle;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 고양이별 미니 챗창 ──
interface Msg { role: "user" | "pet"; text: string; }
type Mode = "chat" | "work";

const OPENING: Record<Mode, (name: string, role: string) => string> = {
  chat: (name) => `${name}야~ 왔어 대장? ㅎㅎ 뭐하고 있었어?`,
  work: (name, role) => `${name}야. 뭐 시킬 거 있어 대장? (${role})`,
};

function PetChat({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("chat");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "pet", text: OPENING.chat(pet.name, pet.role) }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // 모드 전환 → 세션 리셋(성격/역할이 바뀌므로) + 인삿말 교체
  const switchMode = (next: Mode) => {
    if (next === mode || busy) return;
    setMode(next);
    setSessionId(null);
    setMsgs([{ role: "pet", text: OPENING[next](pet.name, pet.role) }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, pet: pet.id, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsgs((m) => [...m, { role: "pet", text: data.reply }]);
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        setMsgs((m) => [...m, { role: "pet", text: `⚠️ ${data.error || "응답 실패"}` }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "pet", text: "⚠️ 연결 실패" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none"
      style={{ animation: "petBarPop .22s ease-out" }}
    >
      <style>{`@keyframes petBarPop { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div className="pointer-events-auto max-w-4xl mx-auto rounded-2xl border-2 border-[#2a2a45] bg-[#0f0f1a]/95 backdrop-blur shadow-2xl overflow-hidden">
        {/* 상단 바: 이름표 + 토글 + 닫기 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#13131f] border-b border-[#1e1e30]">
          <span className="text-sm font-bold text-white">{pet.name}</span>
          <span className="text-[10px] text-[#71717a]">
            {busy ? "…" : mode === "chat" ? "수다 중 🐾" : pet.role}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg bg-[#0f0f1a] border border-[#2a2a45] overflow-hidden text-[11px]">
              <button
                onClick={() => switchMode("chat")}
                className={`px-2.5 py-0.5 transition ${mode === "chat" ? "bg-[#8b5cf6] text-white" : "text-[#71717a] hover:text-white"}`}
              >
                🐾 수다
              </button>
              <button
                onClick={() => switchMode("work")}
                className={`px-2.5 py-0.5 transition ${mode === "work" ? "bg-[#8b5cf6] text-white" : "text-[#71717a] hover:text-white"}`}
              >
                💼 일
              </button>
            </div>
            <button onClick={onClose} className="text-[#71717a] hover:text-white text-base px-1">✕</button>
          </div>
        </div>

        {/* 게임형 본문: 큰 아바타 + 대사 영역 */}
        <div className="flex items-stretch gap-3 p-3">
          {/* 왼쪽: 캐릭터 초상 */}
          <div className="shrink-0 flex flex-col items-center justify-end w-20 sm:w-24">
            <div className="rounded-xl border-2 border-[#2a2a45] bg-[#13131f] p-1.5 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/pets/${pet.id}.png`} alt={pet.name} className="w-full h-auto object-contain" style={{ imageRendering: "pixelated" }} />
            </div>
          </div>

          {/* 오른쪽: 대화 로그 (최근 대사 강조) */}
          <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto space-y-2 h-32 sm:h-36 pr-1">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-[#2563eb] text-white rounded-br-sm" : "bg-[#1c1c2b] text-[#e4e4e7] rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-[#1c1c2b] rounded-xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]" style={{ animation: `petThink 1s ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 입력 바 */}
        <div className="border-t border-[#1e1e30] p-2.5 bg-[#13131f]">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={mode === "chat" ? `${pet.name}랑 수다 떨기…` : `${pet.name}한테 시키기…`}
              className="flex-1 resize-none bg-[#0f0f1a] border border-[#2a2a45] rounded-xl px-3 py-2 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] max-h-24"
            />
            <button onClick={send} disabled={busy || !input.trim()} className="shrink-0 h-9 px-4 rounded-xl bg-[#2563eb] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#1d4ed8] transition">↑</button>
          </div>
        </div>
        <style>{`@keyframes petThink { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
      </div>
    </div>
  );
}
