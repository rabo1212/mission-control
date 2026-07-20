"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("비밀번호가 틀렸습니다");
      }
    } catch {
      setError("로그인 실패, 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="text-xl font-bold text-[#f5f5f7]">Mission Control</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">대장님 전용 대시보드</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3 bg-[#0a0a12] border border-[#1e1e30] rounded-xl text-[#f5f5f7] placeholder-[#6b7280] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-[#ef4444] text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#6b7280] disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
