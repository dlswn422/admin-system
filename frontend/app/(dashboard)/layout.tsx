"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/layout/admin-sidebar";
import AdminHeader from "../components/layout/admin-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isSidebarOpen]);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    setIsLogoutModalOpen(false);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* 사이드바 영역 */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 h-screen transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <AdminSidebar onLogoutOpen={() => setIsLogoutModalOpen(true)} />
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        
        {/* 슬림 헤더 섹션 */}
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white/70 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-50">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="mr-4 rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
          >
            ☰
          </button>
          
          <AdminHeader />
        </header>

        {/* 페이지 메인 스크롤 구역 */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </div>

      {/* 로그아웃 커스텀 모달 */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-[calc(100%-2rem)] max-w-sm rounded-[2.5rem] border border-white/10 bg-[#0F172A] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl shadow-inner">🚪</div>
              <h3 className="text-xl font-black text-white tracking-tighter">로그아웃 하시겠습니까?</h3>
              <p className="mt-2 text-sm text-slate-400 font-medium">안전하게 세션을 종료하고<br/>인증 화면으로 돌아갑니다.</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setIsLogoutModalOpen(false)} 
                className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-slate-300 hover:bg-white/10 transition-all"
              >
                취소
              </button>
              <button 
                onClick={confirmLogout} 
                className="flex-1 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 py-4 text-sm font-bold text-white shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}