/**
 * JSON → SQLite 마이그레이션 스크립트
 * 실행: npx tsx scripts/migrate-to-sqlite.ts
 */
import { migrateFromJson } from "../src/lib/db";

console.log("🚀 JSON → SQLite 마이그레이션 시작...\n");

try {
  migrateFromJson();
  console.log("\n✅ 마이그레이션 완료! data/mission-control.db 생성됨");
  console.log("💡 .env에 DATA_MODE=sqlite 설정 후 서버 재시작하세요");
} catch (err) {
  console.error("❌ 마이그레이션 실패:", err);
  process.exit(1);
}
