"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/layout/admin-sidebar";
import AdminHeader from "../components/layout/admin-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "unset";
  }, [isSidebarOpen]);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    setIsLogoutModalOpen(false);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#F8FAFC]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[70] h-screen w-72 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <AdminSidebar onLogoutOpen={() => setIsLogoutModalOpen(true)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-50 shrink-0 bg-transparent px-3 pt-3 md:px-5 md:pt-4">
          <header className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,14,28,0.86)_0%,rgba(7,12,24,0.8)_100%)] shadow-[0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg text-slate-300 shadow-[0_10px_24px_rgba(2,6,23,0.16)] backdrop-blur-xl transition-all hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white lg:hidden"
              aria-label="메뉴 열기"
            >
              ☰
            </button>

            <div className="min-w-0 pl-[58px] pr-4 lg:px-6">
              <div className="flex min-h-[84px] items-center">
                <AdminHeader />
              </div>
            </div>
          </header>
        </div>

        <main className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="animate-in fade-in slide-in-from-bottom-2 px-3 pb-4 pt-3 duration-700 md:px-5 md:pb-6 md:pt-4">
            {children}
          </div>
        </main>
      </div>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-[calc(100%-2rem)] max-w-sm rounded-[2.5rem] border border-white/10 bg-[#0F172A] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl shadow-inner">
                🚪
              </div>
              <h3 className="text-xl font-black tracking-tighter text-white">
                로그아웃 하시겠습니까?
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-400">
                안전하게 세션을 종료하고
                <br />
                인증 화면으로 돌아갑니다.
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-white/10"
              >
                취소
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 py-4 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition-all active:scale-95"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}