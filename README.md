# 🎯 Mission Control

대장님의 프로젝트 통합 대시보드

## 주요 기능

- **프로젝트 대시보드** — 43개 프로젝트 상태 한눈에
- **가재군단** — 16마리 에이전트 팀 관리
- **가재사무실** — 에이전트 시각화 (애니메이션)
- **토큰/비용 트래킹** — API 호출량, 비용 모니터링
- **실시간 업데이트** — SSE 방식 라이브 상태
- **텔레그램 알림** — 에러/긴급 상황 자동 알림
- **비밀번호 인증** — 간단한 접근 제어

## 설치

```bash
# 1. 의존성 설치
npm install

# 2. 추가 패키지 설치 (보완 기능용)
npm install better-sqlite3
npm install -D @types/better-sqlite3 tsx

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 열어서 값 수정
```

## 환경변수 (.env.local)

```env
# 인증 비밀번호 (비워두면 인증 없이 동작)
MC_PASSWORD=your-password

# JWT 시크릿
MC_JWT_SECRET=random-secret-string

# 텔레그램 알림 (선택)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# 데이터 모드 (기본: json)
DATA_MODE=json
```

## 실행

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build && npm start
```

## SQLite 마이그레이션 (선택)

기존 JSON 데이터를 SQLite로 변환하려면:

```bash
npx tsx scripts/migrate-to-sqlite.ts
```

그 후 `.env.local`에서 `DATA_MODE=sqlite` 설정

## 토큰 사용량 기록 API

외부에서 토큰 사용량을 기록하려면:

```bash
curl -X POST http://localhost:3000/api/token-usage \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "host",
    "projectSlug": "poly-oracle",
    "model": "claude-sonnet-4-20250514",
    "inputTokens": 1500,
    "outputTokens": 800,
    "costUsd": 0.012
  }'
```

## 텔레그램 알림 API

```bash
curl -X POST http://localhost:3000/api/telegram/alert \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "source": "PolyOracle",
    "message": "ACP 서비스 응답 지연"
  }'
```

## 기술 스택

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · SQLite (better-sqlite3) · SSE

---

🦞 가재군단 파이팅!
