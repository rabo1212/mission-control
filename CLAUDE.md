# mission-control — 프로젝트 통합 대시보드

## Purpose
모든 프로젝트 현황을 한눈에 보는 미션 컨트롤 대시보드. 타임라인 + 클코 브리핑 생성기.

## Stack
Next.js 16, React 19, Tailwind 4, TypeScript, better-sqlite3

## Commands
```bash
PORT=3005 npm run dev       # 개발 서버 (3005 고정)
npm run build               # 빌드
npm run lint                # ESLint
node scripts/update-project.mjs --slug <slug> --activity "<요약>"  # 프로젝트 업데이트
```

## Structure
- `data/projects.json` — 파일 기반 DB (Phase 3에서 Supabase 전환 예정)
- `src/` — Next.js 앱
- `scripts/update-project.mjs` — CLI 업데이트 도구

## Rules
- 다크 테마 (#0a0a12 배경) 유지
- 포트 3005 고정 (3000~3004 사용 중)
- 데이터는 파일 기반 — 외부 DB 없음
- Vercel 배포: https://mission-control-rabo1.vercel.app
