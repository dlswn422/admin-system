"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight } from "lucide-react";

export default function AdminHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("사용자");
  const [userRole, setUserRole] = useState("권한 미정");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);

      setUserName(parsed?.name || "사용자");
      setUserRole(
        parsed?.role_name || parsed?.role || parsed?.roles?.name || "권한 미정"
      );
    } catch (error) {
      console.error("유저 정보 파싱 에러", error);
    }
  }, []);

  const displayName = useMemo(() => {
    const cleanPath = pathname.split("?")[0].split("#")[0];
    const segments = cleanPath.split("/").filter(Boolean);
    const currentPathName = segments[segments.length - 1] || "dashboard";

    const pathMap: Record<string, string> = {
      dashboard: "대시보드",
      users: "사용자 관리",
      roles: "역할 관리",
      menus: "메뉴 관리",
      codes: "코드 관리",
      customers: "고객 관리",
      "consult-history": "상담내역",
      "sales-history": "영업내역",
    };

    return pathMap[currentPathName] || currentPathName;
  }, [pathname]);

  const initial = userName?.[0] || "사";

  return (
    <div className="header-shell">
      <div className="title-block">
        <div className="meta-line">
          <span>관리 시스템</span>
          <ChevronRight size={12} className="meta-sep" />
          <span>운영 영역</span>
        </div>

        <div className="title-row">
          <span className="title-dot" />
          <h1 className="title-text">{displayName}</h1>
        </div>
      </div>

      <div className="action-group">
        <button type="button" className="icon-btn" aria-label="알림">
          <span className="icon-shine" />
          <Bell size={18} className="icon-main" />
          <span className="alert-dot-wrap">
            <span className="alert-dot-ping" />
            <span className="alert-dot" />
          </span>
        </button>

        <div className="profile-card">
          <div className="profile-copy">
            <span className="profile-name">{userName}</span>
            <span className="profile-role">{userRole}</span>
          </div>

          <div className="profile-avatar">{initial}</div>
        </div>
      </div>
    </div>
  );
}