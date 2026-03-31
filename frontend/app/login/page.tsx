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
        /**
         * 💡 핵심 해결책:
         * 사이드바 권한 필터링을 위해 'role_id'를 반드시 포함하여 저장합니다.
         * data.user 객체에 role_id가 포함되어 있는지 API 코드를 꼭 확인하세요.
         */
        localStorage.setItem("user", JSON.stringify({
          name: data.user.name,
          role: data.user.role_name || "시스템 관리자",
          role_id: data.user.role_id // ✨ 이 값이 없으면 메뉴가 나오지 않습니다.
        }));

        // 대시보드로 이동
        router.push("/dashboard");
      } else {
        setError(data.error || "아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다. 관리자에게 문의하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020617] px-6 py-12 overflow-hidden">
      {/* 배경 그래디언트 효과 */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-600/10 blur-[130px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[130px] animate-pulse" />

      <div className="relative w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-700">
        {/* 상단 로고 및 텍스트 */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 text-4xl font-black text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] italic font-serif">
            A
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500/60">Operational Interface</p>
            <h1 className="text-5xl font-black tracking-tighter text-white italic font-serif">ADMIN <span className="font-light text-slate-500 not-italic">OS</span></h1>
          </div>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="overflow-hidden rounded-[3.5rem] border border-white/10 bg-white/[0.02] p-10 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Personnel Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-5 text-sm font-bold text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500/40 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/5"
                placeholder="관리자 성함을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Access Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-5 text-sm font-bold text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500/40 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/5"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-4 text-center text-xs font-black text-rose-400 border border-rose-500/20 animate-in slide-in-from-top-2">
                <span className="flex-1 text-center uppercase tracking-tighter">{error}</span>
              </div>
            )}

            {/* 접속 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-4 w-full overflow-hidden rounded-[2rem] bg-slate-900 py-5 font-black text-white shadow-xl transition-all hover:bg-blue-600 active:scale-[0.97] disabled:opacity-50"
            >
              <span className={`transition-all duration-300 ${isLoading ? "opacity-0" : "opacity-100 uppercase tracking-widest text-xs"}`}>
                Establish Connection
              </span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* 하단 푸터 */}
        <p className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.5em] text-slate-700">
          © 2026 Admin System Logic. Built for Enterprise.
        </p>
      </div>
    </div>
  );
}