"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("사용자");
  const [userRole, setUserRole] = useState("Personnel");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserName(parsed.name);
      setUserRole(parsed.role || "Operator");
    }
  }, []);

  // 경로를 기반으로 간단한 위치 표시 (예: /users -> USERS)
  const currentPathName = pathname.split("/").filter(Boolean).pop() || "Dashboard";

  return (
    <div className="flex w-full items-center justify-between">
      {/* 왼쪽: 심플한 브레드크럼 & 로고 포인트 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200/50">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            {currentPathName}
          </span>
        </div>
        <div className="hidden md:block h-4 w-[1px] bg-slate-200"></div>
        <h2 className="hidden md:block text-sm font-medium text-slate-400 tracking-tight">
          System Operational Interface
        </h2>
      </div>

      {/* 오른쪽: 알림 및 유저 정보 (사이드바와 톤앤매너 통일) */}
      <div className="flex items-center gap-3">
        {/* 알림 아이콘 */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 active:scale-95">
          <span className="text-lg">🔔</span>
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
        </button>

        {/* 유저 프로필 유닛 */}
        <div className="flex items-center gap-3 pl-3 py-1 pr-1 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="hidden sm:block text-right leading-none">
            <p className="text-sm font-black text-slate-900 tracking-tighter">{userName}</p>
            <p className="mt-1 text-[10px] font-bold text-blue-600 uppercase opacity-70 tracking-tighter">
              {userRole}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#020617] text-[13px] font-black text-white shadow-inner">
            {userName.substring(0, 1)}
          </div>
        </div>
      </div>
    </div>
  );
}