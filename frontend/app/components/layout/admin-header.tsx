"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight } from "lucide-react";

export default function AdminHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("사용자");
  const [userRole, setUserRole] = useState("관리자");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      setUserName(parsed.name || "사용자");
      setUserRole(parsed.role || "관리자");
    } catch (error) {
      console.error("유저 정보 파싱 에러", error);
    }
  }, []);

  const displayName = useMemo(() => {
    const currentPathName =
      pathname.split("/").filter(Boolean).pop() || "dashboard";

    const pathMap: Record<string, string> = {
      dashboard: "대시보드",
      users: "사용자 관리",
      roles: "역할 관리",
      menus: "메뉴 관리",
      codes: "코드 관리",
      customers: "고객 관리",
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

      <style jsx>{`
        .header-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
          min-width: 0;
          animation: header-fade-up 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
          font-family:
            "Pretendard Variable",
            Pretendard,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .title-block {
          min-width: 0;
          flex: 1;
        }

        .meta-line {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: rgba(148, 163, 184, 0.8);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }

        .meta-sep {
          flex-shrink: 0;
          color: rgba(100, 116, 139, 0.9);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          margin-top: 8px;
        }

        .title-dot {
          position: relative;
          width: 10px;
          height: 10px;
          flex-shrink: 0;
          border-radius: 9999px;
          background: #60a5fa;
          box-shadow: 0 0 16px rgba(96, 165, 250, 0.85);
        }

        .title-dot::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(96, 165, 250, 0.42);
          animation: dot-ping-soft 1.9s ease-out infinite;
        }

        .title-text {
          margin: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #ffffff;
          font-size: 27px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.045em;
          text-shadow: 0 2px 12px rgba(255, 255, 255, 0.04);
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .icon-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.045);
          color: #cbd5e1;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.16);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          overflow: hidden;
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            background-color 0.28s ease,
            color 0.28s ease,
            box-shadow 0.28s ease;
        }

        .icon-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.2);
          background: rgba(59, 130, 246, 0.09);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.16);
        }

        .icon-shine {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.14) 20%,
            transparent 42%
          );
          transition: opacity 0.35s ease;
        }

        .icon-btn:hover .icon-shine {
          opacity: 1;
          animation: shimmer-x 2.6s linear infinite;
        }

        .icon-main {
          position: relative;
          z-index: 1;
        }

        .alert-dot-wrap {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 9px;
          height: 9px;
        }

        .alert-dot-ping {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: rgba(251, 113, 133, 0.6);
          animation: dot-ping-soft 1.7s ease-out infinite;
        }

        .alert-dot {
          position: relative;
          display: block;
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: #fb7185;
          border: 2px solid rgba(9, 14, 24, 0.96);
          z-index: 1;
        }

        .profile-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 6px 8px 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 14px 30px rgba(2, 6, 23, 0.16);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            background-color 0.28s ease,
            box-shadow 0.28s ease;
        }

        .profile-card:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.065);
          box-shadow: 0 16px 34px rgba(2, 6, 23, 0.18);
        }

        .profile-copy {
          display: none;
          min-width: 0;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.15;
        }

        @media (min-width: 640px) {
          .profile-copy {
            display: flex;
          }
        }

        .profile-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .profile-role {
          margin-top: 4px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 500;
        }

        .profile-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #4f46e5 50%,
            #8b5cf6 100%
          );
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(59, 130, 246, 0.22);
        }

        @keyframes header-fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer-x {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(140%);
          }
        }

        @keyframes dot-ping-soft {
          0% {
            transform: scale(0.85);
            opacity: 0.7;
          }
          80%,
          100% {
            transform: scale(1.9);
            opacity: 0;
          }
        }

        @media (max-width: 1024px) {
          .title-text {
            font-size: 25px;
          }
        }

        @media (max-width: 640px) {
          .meta-line {
            font-size: 11px;
          }

          .title-text {
            font-size: 22px;
          }

          .icon-btn {
            width: 44px;
            height: 44px;
            border-radius: 16px;
          }

          .profile-card {
            padding: 5px 6px 5px 10px;
            border-radius: 18px;
          }

          .profile-avatar {
            width: 38px;
            height: 38px;
            border-radius: 14px;
          }
        }
      `}</style>
    </div>
  );
}