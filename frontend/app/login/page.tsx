"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // --- 💡 핵심: 사이드바에서 사용할 유저 정보 저장 ---
        // 로그인 API 응답 데이터(data.user)를 기반으로 저장합니다.
        localStorage.setItem("user", JSON.stringify({
          name: data.user.name,
          role: "시스템 관리 권한" // 필요 시 data.user.role 등으로 변경 가능
        }));

        router.push("/dashboard");
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020617] px-6 py-12 overflow-hidden">
      {/* 배경 장식용 빛무리 */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px]" />

      <div className="relative w-full max-w-[440px]">
        {/* 로고 섹션 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-cyan-400 text-3xl font-bold text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)]">
            A
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.4em] text-blue-400/80">Back Office</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Admin System</h1>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10"
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 py-3 text-center text-sm font-medium text-rose-400 animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-4 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4.5 font-bold text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] disabled:opacity-50"
            >
              <span className={isLoading ? "opacity-0" : "opacity-100"}>시스템 접속하기</span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-xs tracking-widest text-slate-600">
          © 2026 ADMIN SYSTEM. DESIGNED FOR EFFICIENCY.
        </p>
      </div>
    </div>
  );
}