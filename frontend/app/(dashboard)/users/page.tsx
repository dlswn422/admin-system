"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserPlus,
  Search,
  RotateCw,
  ShieldCheck,
  Users,
  Mail,
  Phone,
  ChevronDown,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  Lock,
  X,
  Fingerprint,
  Smartphone,
  Sparkles,
  UserCog,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role_id: "",
    password: "",
    is_active: true,
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const formatDate = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}. ${month}. ${day}`;
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
      ]);

      const uData = await uRes.json();
      const rData = await rRes.json();

      const nextUsers = Array.isArray(uData) ? uData : [];
      const nextRoles = Array.isArray(rData) ? rData : [];

      setUsers(nextUsers);
      setRoles(nextRoles);

      if (nextRoles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          role_id: prev.role_id || nextRoles[0].id,
        }));
      }
    } catch (error) {
      showToast("데이터 동기화 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRoleFilter === "all" || user.role_name === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const activeUsersCount = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users]
  );

  const inactiveUsersCount = useMemo(
    () => users.filter((user) => !user.is_active).length,
    [users]
  );

  const adminUsersCount = useMemo(
    () => users.filter((user) => user.role_name.includes("관리자")).length,
    [users]
  );

  const resultSummary = useMemo(() => {
    const parts: string[] = [];

    if (selectedRoleFilter !== "all") {
      parts.push(`${selectedRoleFilter} 필터`);
    }

    if (searchQuery) {
      parts.push(`검색 결과 ${filteredUsers.length}명`);
    } else if (selectedRoleFilter !== "all") {
      parts.push(`결과 ${filteredUsers.length}명`);
    } else {
      parts.push(`총 ${users.length}명 사용자`);
    }

    return parts.join(" · ");
  }, [filteredUsers.length, searchQuery, selectedRoleFilter, users.length]);

  const openModal = (user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        password: "",
        is_active: user.is_active,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role_id: roles.length > 0 ? roles[0].id : "",
        password: "",
        is_active: true,
      });
    }

    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedUser;

    try {
      const res = await fetch(
        isEdit ? `/api/users/${selectedUser?.id}` : "/api/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        showToast(
          isEdit ? "사용자 정보가 갱신되었습니다." : "새 계정이 생성되었습니다."
        );
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast("처리 중 오류가 발생했습니다.", "error");
      }
    } catch (error) {
      showToast("네트워크 통신 오류", "error");
    }
  };

  const openDeleteModal = (user: User) => {
    setDeleteTarget(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("삭제 완료");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchData();
      } else {
        showToast("삭제 실패", "error");
      }
    } catch (error) {
      showToast("삭제 실패", "error");
    }
  };

  const getRoleStyle = (role: string) => {
    if (role.includes("관리자")) {
      return "bg-slate-900 text-white border-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)]";
    }

    if (role.includes("영업")) {
      return "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50";
    }

    if (role.includes("상담")) {
      return "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50";
    }

    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] border border-white/10 px-5 py-4 shadow-[0_24px_50px_rgba(15,23,42,0.2)] backdrop-blur-2xl animate-in slide-in-from-right-8 duration-300 ${
            toast.type === "success"
              ? "bg-slate-900/90 text-white"
              : "bg-rose-600/90 text-white"
          }`}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold tracking-[-0.02em]">{toast.message}</p>
        </div>
      )}

      {/* 상단 히어로 */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,18,36,0.88))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.18)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,transparent_72%,rgba(59,130,246,0.06))]" />
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-blue-500/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200">
                <Users className="h-3.5 w-3.5" />
                계정 관리
              </div>

              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                사용자 관리
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                시스템 사용자 계정과 권한 그룹, 활성 상태를 통합 관리합니다.
                운영 조직의 계정 보안과 접근 제어를 한 화면에서 확인할 수
                있도록 구성했습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchData}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                aria-label="새로고침"
              >
                <RotateCw
                  className={`h-5 w-5 transition-transform duration-500 ${
                    isLoading ? "animate-spin" : "group-hover:rotate-180"
                  }`}
                />
              </button>

              <button
                onClick={() => openModal()}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 px-6 py-4 text-sm font-extrabold tracking-[-0.02em] text-white shadow-[0_18px_36px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(59,130,246,0.32)] active:scale-[0.98]"
              >
                <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.16)_20%,transparent_42%)] [animation:shimmer-x_2.8s_linear_infinite]" />
                <UserPlus className="relative z-10 h-4.5 w-4.5" />
                <span className="relative z-10">새 사용자 추가</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 요약 카드 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "전체 사용자",
            value: users.length.toString().padStart(2, "0"),
            icon: Users,
            tone: "bg-blue-500/10 text-blue-600 ring-blue-500/15",
          },
          {
            label: "활성 계정",
            value: activeUsersCount.toString().padStart(2, "0"),
            icon: UserCog,
            tone: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15",
          },
          {
            label: "비활성 계정",
            value: inactiveUsersCount.toString().padStart(2, "0"),
            icon: Lock,
            tone: "bg-slate-900/10 text-slate-700 ring-slate-300/40",
          },
          {
            label: "관리자 계정",
            value: adminUsersCount.toString().padStart(2, "0"),
            icon: ShieldCheck,
            tone: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="fade-up group rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/95 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${stat.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">
                {stat.label} 현황 요약
              </p>
            </div>
          );
        })}
      </section>

      {/* 검색 / 필터 */}
      <section className="fade-up rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-600" />
              <input
                type="text"
                placeholder="사용자 이름 또는 이메일 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-4 pl-14 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="all">모든 권한 그룹</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            <Sparkles className="h-4 w-4" />
            {resultSummary}
          </div>
        </div>
      </section>

      {/* 사용자 레지스트리 */}
      <section className="fade-up overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
                사용자 레지스트리
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                계정 정보, 권한 그룹, 상태를 확인하고 수정할 수 있습니다.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              실시간 반영
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="hidden rounded-2xl bg-slate-50 px-5 py-3 text-[11px] font-bold tracking-[0.12em] text-slate-400 md:grid md:grid-cols-[minmax(320px,1.5fr)_160px_160px_160px] md:items-center md:gap-4">
            <span>사용자 정보</span>
            <span>권한 그룹</span>
            <span>계정 상태</span>
            <span className="text-right">작업</span>
          </div>

          <div className="mt-3 space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-[24px] border border-slate-100 bg-slate-50/80 animate-pulse"
                />
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-800">
                  표시할 사용자가 없습니다
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  검색 조건을 변경하거나 새 사용자를 추가해보세요.
                </p>
                <button
                  onClick={() => openModal()}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-600"
                >
                  <UserPlus className="h-4 w-4" />
                  새 사용자 추가
                </button>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="group rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(320px,1.5fr)_160px_160px_160px] md:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#13233F_0%,#0B1730_100%)] text-2xl font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)]">
                        {user.name[0]}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[1.15rem] font-black tracking-[-0.04em] text-slate-900 transition-colors group-hover:text-blue-600">
                            {user.name}
                          </h3>

                          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                            내부 ID {user.id.split("-")[0]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span className="truncate">
                              {user.phone || "연락처 없음"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          생성일 {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center md:justify-center">
                      <span
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black tracking-[0.08em] ${getRoleStyle(
                          user.role_name
                        )}`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {user.role_name}
                      </span>
                    </div>

                    <div className="flex items-center md:justify-center">
                      <div
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black tracking-[0.08em] ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.is_active
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-rose-500"
                          }`}
                        />
                        {user.is_active ? "활성" : "비활성"}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(user)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>수정</span>
                      </button>

                      <button
                        onClick={() => openDeleteModal(user)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                        aria-label={`${user.name} 삭제`}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 사용자 설정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_40px_90px_rgba(15,23,42,0.25)] animate-in zoom-in-95 duration-300">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            <div className="grid max-h-[90vh] overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
              <div className="custom-scrollbar overflow-y-auto p-8 md:p-10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    <UserPlus className="h-3.5 w-3.5" />
                    계정 정보 설정
                  </div>

                  <h2 className="mt-4 text-[2rem] font-black tracking-[-0.05em] text-slate-900">
                    {selectedUser ? "사용자 수정" : "사용자 추가"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    기본 정보와 권한, 계정 상태를 설정합니다.
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        이름
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        placeholder="예: 홍길동"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        연락처
                      </label>
                      <div className="relative">
                        <Smartphone className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="010-0000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        이메일
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="example@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        비밀번호
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                        <input
                          type="password"
                          required={!selectedUser}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder={
                            selectedUser ? "비워두면 기존 비밀번호 유지" : "비밀번호 입력"
                          }
                        />
                      </div>
                      {selectedUser && (
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          비워두면 기존 비밀번호를 유지합니다.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        권한 그룹
                      </label>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                        <select
                          value={formData.role_id}
                          onChange={(e) =>
                            setFormData({ ...formData, role_id: e.target.value })
                          }
                          className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        계정 상태
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            is_active: !formData.is_active,
                          })
                        }
                        className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 transition-all ${
                          formData.is_active
                            ? "border-blue-200 bg-blue-50 text-blue-600 shadow-sm shadow-blue-50"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        <span className="text-sm font-bold">
                          {formData.is_active ? "계정 활성" : "계정 비활성"}
                        </span>
                        {formData.is_active ? (
                          <CheckCircle2 className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </button>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {formData.is_active
                          ? "로그인 및 시스템 접근이 가능한 상태입니다."
                          : "로그인과 시스템 접근이 차단된 상태입니다."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-[1.3] rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>

              <div className="custom-scrollbar overflow-y-auto border-t border-slate-100 bg-gradient-to-br from-slate-50 to-white p-8 lg:border-l lg:border-t-0 lg:p-10">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-blue-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    사용자 미리보기
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#13233F_0%,#0B1730_100%)] text-2xl font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)]">
                        {(formData.name || "사").slice(0, 1)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[1.15rem] font-black tracking-[-0.04em] text-slate-900">
                          {formData.name || "이름"}
                        </p>
                        <p className="mt-2 truncate rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                          {roles.find((role) => role.id === formData.role_id)?.name ||
                            "권한 그룹"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <Mail className="h-4.5 w-4.5 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">
                            이메일
                          </p>
                          <p className="truncate text-sm font-bold text-slate-800">
                            {formData.email || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <Phone className="h-4.5 w-4.5 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">
                            연락처
                          </p>
                          <p className="truncate text-sm font-bold text-slate-800">
                            {formData.phone || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <Fingerprint className="h-4.5 w-4.5 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">
                            계정 상태
                          </p>
                          <p className="truncate text-sm font-bold text-slate-800">
                            {formData.is_active ? "활성" : "비활성"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-10 shadow-[0_40px_90px_rgba(15,23,42,0.25)] text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-rose-50 text-rose-500 shadow-inner">
              <AlertTriangle className="h-9 w-9" />
            </div>

            <h3 className="text-[1.8rem] font-black tracking-[-0.05em] text-slate-900">
              사용자 삭제
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              <span className="font-bold text-slate-800">
                {deleteTarget?.name || "선택된 사용자"}
              </span>{" "}
              계정을 삭제하시겠습니까?
              <br />
              삭제 후에는 복구할 수 없습니다.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-black text-white shadow-[0_16px_32px_rgba(225,29,72,0.18)] transition-all hover:bg-rose-700 active:scale-[0.98]"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}