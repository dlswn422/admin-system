"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string;
}

interface UserInfo {
  name: string;
  role: string;
}

export default function AdminSidebar({ onLogoutOpen }: { onLogoutOpen: () => void }) {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser({ name: "대표", role: "시스템 관리 권한" });
    }

    const fetchMenus = async () => {
      try {
        const response = await fetch("/api/menus");
        const data = await response.json();
        if (Array.isArray(data)) setMenuItems(data);
      } catch (error) {
        console.error("메뉴 로드 실패", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  return (
    <aside className="flex h-screen w-full flex-col bg-[#020617] text-slate-200 shadow-2xl overflow-hidden border-r border-white/5">
      {/* 로고 영역: 약간의 네온 효과 추가 */}
      <div className="shrink-0 px-8 py-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-xl font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            A
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500/80">Premium Console</p>
            <h1 className="text-xl font-black tracking-tighter text-white">ADMIN <span className="font-light text-slate-400">OS</span></h1>
          </div>
        </div>
      </div>

      {/* 유저 카드: 유리질감(Glassmorphism) 강화 */}
      <div className="shrink-0 px-6 py-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 blur-2xl" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Authorized Personnel</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xl font-black text-white">{user?.name || "대표"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs font-medium text-slate-400">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 내비게이션: 호버 및 활성화 디자인 고도화 */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <p className="mb-6 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">Main Control</p>
        <ul className="space-y-2">
          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <li key={i} className="h-14 w-full animate-pulse rounded-2xl bg-white/5 mx-auto" />
            ))
          ) : (
            menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <li key={item.id}>
                  <Link 
                    href={item.path} 
                    className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)]" 
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-125"}`}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.title}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
                    )}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </nav>

      {/* 하단 영역: 로그아웃 버튼 디자인 깔끔하게 */}
      <div className="shrink-0 border-t border-white/5 bg-[#020617] p-6">
        <button 
          onClick={onLogoutOpen} 
          className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-4 text-sm font-black text-rose-500 transition-all hover:bg-rose-500 hover:text-white active:scale-95 shadow-lg shadow-rose-500/5"
        >
          <span className="text-lg transition-transform group-hover:rotate-12">🚪</span>
          <span>로그아웃</span>
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </aside>
  );
}