"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserPlus,
  Search,
  RotateCw,
  UserCircle,
  Phone,
  ChevronDown,
  Filter,
  Trash2,
  Edit3,
  Building,
  CalendarDays,
  MapPin,
  NotebookTabs,
  X,
  ChevronLeft,
  ChevronRight,
  FileAudio,
  Smartphone,
  Wallet,
  Mic,
  Activity,
  Layers,
  Link2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface Customer {
  id: string;
  customer_name: string;
  company_name: string;
  mobile_phone: string;
  landline_phone: string;
  address: string;
  note: string;
  receipt_date: string;
  tm_id: string;
  consult_date: string;
  consult_status: string;
  consult_memo: string;
  recording_url_1: string;
  recording_url_2: string;
  sales_id: string;
  sales_date: string;
  sales_status: string;
  sales_memo: string;
  sales_commission: number;
}

interface User {
  id: string;
  name: string;
  role_name: string;
}

interface CommonCode {
  code_value: string;
  code_name: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

type FilterState = {
  date_type: string;
  date_from: string;
  date_to: string;
  search: string;
  tm_id: string;
  consult_status: string;
  sales_status: string;
};

const INITIAL_FILTERS: FilterState = {
  date_type: "접수일",
  date_from: "",
  date_to: "",
  search: "",
  tm_id: "all",
  consult_status: "all",
  sales_status: "all",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const [toast, setToast] = useState<Toast | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const formatDate = useCallback((value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}. ${month}. ${day}`;
  }, []);

  const formatDateTime = useCallback((value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}. ${month}. ${day} ${hour}:${minute}`;
  }, []);

  const getStatusTone = useCallback(
    (value?: string, kind: "consult" | "sales" = "consult") => {
      const v = (value || "").trim();

      if (!v) return "bg-slate-100 text-slate-500";

      if (/(완료|계약|성공|종결|방문약속|방문완료|진행중)/.test(v)) {
        return "bg-emerald-50 text-emerald-600";
      }

      if (/(대기|전|예정|접수|상담중|검토)/.test(v)) {
        return kind === "consult"
          ? "bg-blue-50 text-blue-600"
          : "bg-violet-50 text-violet-600";
      }

      if (/(보류|취소|실패|중지|거절)/.test(v)) {
        return "bg-rose-50 text-rose-500";
      }

      return kind === "consult"
        ? "bg-cyan-50 text-cyan-600"
        : "bg-violet-50 text-violet-600";
    },
    []
  );

  const getUserNameById = useCallback(
    (id?: string) => {
      if (!id) return "미배정";
      return users.find((user) => user.id === id)?.name || "미배정";
    },
    [users]
  );

  const fetchInitialData = useCallback(
    async (nextFilters: FilterState) => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          date_type: nextFilters.date_type,
          date_from: nextFilters.date_from,
          date_to: nextFilters.date_to,
          search: nextFilters.search,
          tm_id: nextFilters.tm_id,
          consult_status: nextFilters.consult_status,
          sales_status: nextFilters.sales_status,
        }).toString();

        const [cRes, uRes, consultCodeRes, salesCodeRes] = await Promise.all([
          fetch(`/api/customers?${query}`),
          fetch("/api/users"),
          fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
          fetch("/api/codes/details/by-group?group_code=SALES_STATUS"),
        ]);

        const cData = await cRes.json();
        const uData = await uRes.json();
        const consultCodesData = await consultCodeRes.json();
        const salesCodesData = await salesCodeRes.json();

        setCustomers(Array.isArray(cData) ? cData : []);
        setUsers(Array.isArray(uData) ? uData : []);
        setConsultCodes(Array.isArray(consultCodesData) ? consultCodesData : []);
        setSalesCodes(Array.isArray(salesCodesData) ? salesCodesData : []);
      } catch (e) {
        console.error("Fetch error", e);
        showToast("고객 데이터를 불러오지 못했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchInitialData(appliedFilters);
  }, [appliedFilters, fetchInitialData]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const paginatedData = customers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCommission = useMemo(() => {
    return customers.reduce((sum, item) => sum + (item.sales_commission || 0), 0);
  }, [customers]);

  const assignedTmCount = useMemo(() => {
    return customers.filter((item) => !!item.tm_id).length;
  }, [customers]);

  const assignedSalesCount = useMemo(() => {
    return customers.filter((item) => !!item.sales_id).length;
  }, [customers]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];

    if (appliedFilters.search) parts.push(`검색 적용`);
    if (appliedFilters.tm_id !== "all") parts.push(`TM 필터`);
    if (appliedFilters.consult_status !== "all") parts.push(`상담 필터`);
    if (appliedFilters.sales_status !== "all") parts.push(`영업 필터`);
    if (appliedFilters.date_from || appliedFilters.date_to) parts.push(`기간 필터`);

    if (parts.length === 0) return `전체 ${customers.length}건`;
    return `${parts.join(" · ")} · 결과 ${customers.length}건`;
  }, [appliedFilters, customers.length]);

  const applyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters(filters);
  };

  const openModal = (customer: Customer | null = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({ ...customer });
    } else {
      setSelectedCustomer(null);
      setFormData({
        receipt_date: new Date().toISOString().split("T")[0],
        consult_status: consultCodes[0]?.code_name || "대기",
        sales_status: salesCodes[0]?.code_name || "방문 전",
        sales_commission: 0,
      });
    }
    setIsModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setDeleteTarget(customer);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedCustomer;
    const url = isEdit ? `/api/customers/${selectedCustomer.id}` : "/api/customers";

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(isEdit ? "고객 정보가 수정되었습니다." : "신규 고객이 등록되었습니다.");
        fetchInitialData(appliedFilters);
      } else {
        showToast("고객 정보 저장에 실패했습니다.", "error");
      }
    } catch (error) {
      showToast("고객 정보 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("고객 정보가 삭제되었습니다.");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchInitialData(appliedFilters);
      } else {
        showToast("고객 정보 삭제에 실패했습니다.", "error");
      }
    } catch (error) {
      showToast("고객 정보 삭제 중 오류가 발생했습니다.", "error");
    }
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
                <Layers className="h-3.5 w-3.5" />
                고객 파이프라인 관리
              </div>

              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                고객 통합 관리
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                접수부터 상담, 녹취, 영업, 수수료 정산까지 고객 관련 흐름을 한
                화면에서 통합 관리합니다. CRM 운영 전반을 빠르게 파악할 수
                있도록 구조화된 화면으로 정리했습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchInitialData(appliedFilters)}
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
                <span className="relative z-10">신규 고객 추가</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 요약 카드 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "전체 고객",
            value: customers.length.toString().padStart(2, "0"),
            icon: Building,
            tone: "bg-blue-500/10 text-blue-600 ring-blue-500/15",
          },
          {
            label: "TM 배정 고객",
            value: assignedTmCount.toString().padStart(2, "0"),
            icon: Mic,
            tone: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15",
          },
          {
            label: "영업 배정 고객",
            value: assignedSalesCount.toString().padStart(2, "0"),
            icon: Activity,
            tone: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
          },
          {
            label: "누적 수수료",
            value: `₩${totalCommission.toLocaleString()}`,
            icon: Wallet,
            tone: "bg-slate-900/10 text-slate-700 ring-slate-300/40",
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
                  <p className="mt-3 truncate text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
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

      {/* 통합 필터 */}
      <section className="fade-up rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)_220px_220px_220px_160px]">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
            <select
              value={filters.date_type}
              onChange={(e) =>
                setFilters({ ...filters, date_type: e.target.value })
              }
              className="w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option>접수일</option>
              <option>상담일자</option>
              <option>영업일자</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters({ ...filters, date_from: e.target.value })
              }
              className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="flex items-center justify-center text-slate-300 font-black">
              ~
            </div>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters({ ...filters, date_to: e.target.value })
              }
              className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-600" />
            <input
              placeholder="업체명, 성함, 연락처 검색"
              className="w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-4 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Mic className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
            <select
              value={filters.tm_id}
              onChange={(e) => setFilters({ ...filters, tm_id: e.target.value })}
              className="w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">모든 TM</option>
              {users
                .filter((user) => user.role_name === "TM")
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <select
                value={filters.consult_status}
                onChange={(e) =>
                  setFilters({ ...filters, consult_status: e.target.value })
                }
                className="w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="all">상담 상태 전체</option>
                {consultCodes.map((code) => (
                  <option key={code.code_value} value={code.code_name}>
                    {code.code_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>

            <div className="relative">
              <select
                value={filters.sales_status}
                onChange={(e) =>
                  setFilters({ ...filters, sales_status: e.target.value })
                }
                className="w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="all">영업 상태 전체</option>
                {salesCodes.map((code) => (
                  <option key={code.code_value} value={code.code_name}>
                    {code.code_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="rounded-[20px] bg-slate-900 px-6 py-4 text-sm font-black text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
          >
            검색
          </button>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          <Sparkles className="h-4 w-4" />
          {filterSummary}
        </div>
      </section>

      {/* 고객 레지스트리 */}
      <section className="fade-up overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
                고객 레지스트리
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                접수, 상담, 영업 상태를 한 번에 확인할 수 있습니다.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              페이지 {currentPage} / {totalPages}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-48 rounded-[26px] border border-slate-100 bg-slate-50/80 animate-pulse"
                />
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((c, index) => {
                const recordingCount =
                  Number(!!c.recording_url_1) + Number(!!c.recording_url_2);

                return (
                  <div
                    key={c.id}
                    className="fade-up cursor-pointer rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                    style={{ animationDelay: `${index * 40}ms` }}
                    onClick={() => openModal(c)}
                  >
                    <div className="grid gap-5 xl:grid-cols-[minmax(320px,1.15fr)_minmax(260px,0.9fr)_minmax(260px,0.9fr)_140px]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#13233F_0%,#0B1730_100%)] text-2xl font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)]">
                          {c.customer_name?.[0] || "C"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-[1.2rem] font-black tracking-[-0.04em] text-slate-900">
                              {c.company_name || "개인 고객"}
                            </h3>
                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                              내부 ID {c.id.split("-")[0]}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                              <UserCircle className="h-4 w-4 text-slate-400" />
                              {c.customer_name || "-"}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                              <Smartphone className="h-4 w-4 text-slate-400" />
                              {c.mobile_phone || "-"}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {c.landline_phone || "일반전화 없음"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2">
                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span className="truncate">{c.address || "주소 없음"}</span>
                            </div>

                            {c.note ? (
                              <div className="inline-flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                                <NotebookTabs className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <span className="line-clamp-2">{c.note}</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            접수일 {formatDate(c.receipt_date)}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/40 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <p className="text-sm font-black tracking-[-0.03em] text-slate-900">
                            상담 현황
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              담당 TM
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {getUserNameById(c.tm_id)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              상담 상태
                            </span>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-black tracking-[0.06em] ${getStatusTone(
                                c.consult_status,
                                "consult"
                              )}`}
                            >
                              {c.consult_status || "미정"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              상담 일시
                            </span>
                            <span className="text-sm font-semibold text-slate-700">
                              {formatDateTime(c.consult_date)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">
                              녹취
                            </span>
                            {recordingCount > 0 ? (
                              <>
                                {c.recording_url_1 ? (
                                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                                    <FileAudio className="h-3.5 w-3.5" />
                                    녹취 1
                                  </span>
                                ) : null}
                                {c.recording_url_2 ? (
                                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                                    <FileAudio className="h-3.5 w-3.5" />
                                    녹취 2
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-sm font-medium text-slate-500">
                                등록 없음
                              </span>
                            )}
                          </div>

                          {c.consult_memo ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium leading-6 text-slate-600 shadow-sm">
                              {c.consult_memo}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-blue-100 bg-blue-50/40 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                          <p className="text-sm font-black tracking-[-0.03em] text-slate-900">
                            영업 현황
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              담당 영업
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {getUserNameById(c.sales_id)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              영업 상태
                            </span>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-black tracking-[0.06em] ${getStatusTone(
                                c.sales_status,
                                "sales"
                              )}`}
                            >
                              {c.sales_status || "미정"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              영업 일자
                            </span>
                            <span className="text-sm font-semibold text-slate-700">
                              {formatDate(c.sales_date)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-400">
                              수수료
                            </span>
                            <span className="text-sm font-black text-blue-600">
                              ₩{(c.sales_commission || 0).toLocaleString()}
                            </span>
                          </div>

                          {c.sales_memo ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium leading-6 text-slate-600 shadow-sm">
                              {c.sales_memo}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-start justify-end gap-2 xl:flex-col xl:items-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(c);
                          }}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>수정</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(c);
                          }}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>

                        {(c.recording_url_1 || c.recording_url_2) && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                            <Link2 className="h-3.5 w-3.5" />
                            녹취 연결 {recordingCount}건
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-20 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-800">
                  표시할 고객이 없습니다
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  검색 조건을 변경하거나 신규 고객을 등록해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
              총 {customers.length}건 중{" "}
              {customers.length === 0
                ? 0
                : Math.min((currentPage - 1) * itemsPerPage + 1, customers.length)}
              -
              {Math.min(currentPage * itemsPerPage, customers.length)} 표시
            </span>

            <div className="flex gap-3">
              <button
                disabled={currentPage === 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => p - 1);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                disabled={currentPage === totalPages || customers.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => p + 1);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 고객 편집 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="custom-scrollbar relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[34px] border border-white/10 bg-white shadow-[0_40px_90px_rgba(15,23,42,0.25)] animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8 md:p-10">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                  <Layers className="h-3.5 w-3.5" />
                  고객 정보 설정
                </div>

                <h2 className="mt-4 text-[2rem] font-black tracking-[-0.05em] text-slate-900">
                  {selectedCustomer ? "고객 정보 수정" : "신규 고객 등록"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  기본 정보, 상담 이력, 영업 진행, 녹취 링크까지 한 번에 관리할 수
                  있습니다.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-10">
                <div className="grid gap-8 xl:grid-cols-[1fr_1fr_1fr]">
                  <section className="space-y-5 rounded-[30px] border border-slate-200 bg-slate-100 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-blue-600" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        01. 고객 기본 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          업체명 *
                        </label>
                        <input
                          required
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.company_name || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company_name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          고객명
                        </label>
                        <input
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.customer_name || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customer_name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-600">
                            휴대전화
                          </label>
                          <input
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-blue-600 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.mobile_phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                mobile_phone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-600">
                            일반전화
                          </label>
                          <input
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.landline_phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                landline_phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          주소
                        </label>
                        <input
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.address || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          접수일
                        </label>
                        <input
                          type="date"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.receipt_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              receipt_date: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          비고
                        </label>
                        <textarea
                          rows={5}
                          className="w-full rounded-[22px] border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.note || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              note: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 rounded-[30px] border border-emerald-100 bg-emerald-100 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        02. 상담 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-emerald-700">
                            담당 TM
                          </label>
                          <select
                            className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                            value={formData.tm_id || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, tm_id: e.target.value })
                            }
                          >
                            <option value="">미배정</option>
                            {users
                              .filter((u) => u.role_name === "TM")
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-emerald-700">
                            상담 상태
                          </label>
                          <select
                            className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                            value={formData.consult_status || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                consult_status: e.target.value,
                              })
                            }
                          >
                            {consultCodes.map((code) => (
                              <option key={code.code_value} value={code.code_name}>
                                {code.code_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-emerald-700">
                          상담 일시
                        </label>
                        <input
                          type="datetime-local"
                          className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                          value={formData.consult_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consult_date: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-emerald-700">
                          상담 메모
                        </label>
                        <textarea
                          rows={5}
                          className="w-full rounded-[22px] border border-emerald-100 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                          value={formData.consult_memo || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consult_memo: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-emerald-700">
                            녹취 링크 1
                          </label>
                          <input
                            className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                            value={formData.recording_url_1 || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                recording_url_1: e.target.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-emerald-700">
                            녹취 링크 2
                          </label>
                          <input
                            className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                            value={formData.recording_url_2 || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                recording_url_2: e.target.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 rounded-[30px] border border-blue-100 bg-blue-100 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-blue-600" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        03. 영업 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-blue-700">
                            담당 영업
                          </label>
                          <select
                            className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.sales_id || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sales_id: e.target.value,
                              })
                            }
                          >
                            <option value="">선택</option>
                            {users
                              .filter((u) => u.role_name === "영업")
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-blue-700">
                            영업 상태
                          </label>
                          <select
                            className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.sales_status || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sales_status: e.target.value,
                              })
                            }
                          >
                            {salesCodes.map((code) => (
                              <option key={code.code_value} value={code.code_name}>
                                {code.code_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-blue-700">
                            영업 일자
                          </label>
                          <input
                            type="date"
                            className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.sales_date || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sales_date: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-blue-700">
                            수수료
                          </label>
                          <input
                            type="number"
                            className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-blue-600 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                            value={formData.sales_commission || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sales_commission: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-blue-700">
                          영업 메모
                        </label>
                        <textarea
                          rows={5}
                          className="w-full rounded-[22px] border border-blue-100 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                          value={formData.sales_memo || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sales_memo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-8 xl:flex-row xl:items-center xl:justify-between">
                  <div className="inline-flex items-center gap-3 rounded-full bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-500">
                    <CalendarDays className="h-4.5 w-4.5 text-blue-500" />
                    접수일 {formData.receipt_date || "-"}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-10 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </form>
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
              고객 삭제
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              <span className="font-bold text-slate-800">
                {deleteTarget?.customer_name || "-"}
              </span>
              {deleteTarget?.company_name
                ? ` / ${deleteTarget.company_name}`
                : ""}
              {" "}고객 정보를 삭제하시겠습니까?
              <br />
              삭제 후에는 복구할 수 없습니다.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleDelete}
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