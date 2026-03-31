"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldCheck, 
  Menu as MenuIcon,
  Search,
  RotateCw,
  X
} from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string; // 데이터베이스에 저장된 이모지 또는 아이콘 이름
}

interface UserInfo {
  name: string;
  role: string;
  role_id?: string; // 권한 필터링 핵심 키
}

export default function AdminSidebar({ onLogoutOpen }: { onLogoutOpen: () => void }) {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 1. 유저 정보 로드 (localStorage)
    const storedUser = localStorage.getItem("user");
    let currentUser: UserInfo | null = null;

    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
        setUser(currentUser);
      } catch (e) {
        console.error("유저 정보 파싱 에러");
      }
    }

    // 2. 권한 기반 메뉴 Fetch
    const fetchMenus = async () => {
      setIsLoading(true);
      try {
        // 💡 role_id가 있을 때만 쿼리 파라미터로 전달 (백엔드 필터링 보장)
        const roleId = currentUser?.role_id;
        
        // role_id가 없으면 보안상 API에서 빈 배열을 반환하도록 설계됨
        const response = await fetch(`/api/menus${roleId ? `?role_id=${roleId}` : ""}`);
        
        if (!response.ok) throw new Error("메뉴 응답 오류");
        
        const data = await response.json();
        if (Array.isArray(data)) {
          setMenuItems(data);
        }
      } catch (error) {
        console.error("사이드바 메뉴 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, []);

  return (
    <aside className="flex h-screen w-full flex-col bg-[#020617] text-slate-200 shadow-2xl overflow-hidden border-r border-white/5 font-sans">
      
      {/* --- 상단 로고 및 브랜딩 --- */}
      <div className="shrink-0 px-8 py-9">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-xl font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-110 duration-500 italic font-serif">
            A
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">Operational Hub</p>
            <h1 className="text-xl font-black tracking-tighter text-white italic font-serif">ADMIN <span className="font-light text-slate-500 not-italic">OS</span></h1>
          </div>
        </div>
      </div>

      {/* --- 사용자 권한 정보 카드 --- */}
      <div className="shrink-0 px-6 py-4">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 blur-2xl" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Identity Verified</p>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-xl font-black text-white tracking-tight">{user?.name || "Accessing..."}</p>
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{user?.role || "Checking Role..."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 시스템 메뉴 내비게이션 --- */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
        <p className="mb-6 px-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">System Console</p>
        <ul className="space-y-2">
          {isLoading ? (
            // 로딩 스켈레톤
            [1, 2, 3, 4, 5].map(i => (
              <li key={i} className="h-14 w-full animate-pulse rounded-2xl bg-white/5 mx-auto" />
            ))
          ) : menuItems.length > 0 ? (
            menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <li key={item.id}>
                  <Link 
                    href={item.path} 
                    className={`group flex items-center gap-4 rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-500 ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)]" 
                        : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className={`text-xl transition-all duration-500 ${isActive ? "scale-110 rotate-3" : "group-hover:scale-125 group-hover:text-blue-400"}`}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight uppercase text-xs font-black">{item.title}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_#fff] animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })
          ) : (
            // 권한 없음 안내
            <div className="px-5 py-12 text-center border border-dashed border-white/5 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                접근 가능한<br/>모듈이 없습니다.
              </p>
            </div>
          )}
        </ul>
      </nav>

      {/* --- 하단 로그아웃 컨트롤 --- */}
      <div className="shrink-0 border-t border-white/5 bg-[#020617] p-6">
        <button 
          onClick={onLogoutOpen} 
          className="group flex w-full items-center justify-center gap-3 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 py-5 text-xs font-black text-rose-500 transition-all hover:bg-rose-500 hover:text-white active:scale-[0.97] shadow-xl shadow-rose-500/5 uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Exit System</span>
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.03); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.08); }
      `}</style>
    </aside>
  );
}