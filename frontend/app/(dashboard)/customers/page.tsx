"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserPlus,
  Search,
  RotateCw,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  AlertTriangle,
  Wallet,
  Mic,
  Download,
  UserCheck,
  Upload,
  Filter,
  Users,
  BriefcaseBusiness,
  CalendarDays,
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
  sales_id: string;
  consult_status: string;
  sales_status: string;
};

const INITIAL_FILTERS: FilterState = {
  date_type: "접수일",
  date_from: "",
  date_to: "",
  search: "",
  tm_id: "all",
  sales_id: "all",
  consult_status: "all",
  sales_status: "all",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [assignTmId, setAssignTmId] = useState("");
  const [assignSalesId, setAssignSalesId] = useState("");

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

  const formatDate = useCallback((val?: string) => {
    if (!val) return "-";
    return val.split("T")[0].replace(/-/g, ".");
  }, []);

  const getUserNameById = useCallback(
    (id?: string) => {
      if (!id) return "미배정";
      return users.find((u) => u.id === id)?.name || "미배정";
    },
    [users]
  );

  const getStatusTone = useCallback((v?: string) => {
    const text = (v || "").trim();
    if (/(완료|계약|성공|종결)/.test(text)) {
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
    if (/(보류|취소|실패|부재)/.test(text)) {
      return "bg-rose-50 text-rose-500 border-rose-100";
    }
    return "bg-blue-50 text-blue-600 border-blue-100";
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      }).toString();

      const [cRes, uRes, cCodeRes, sCodeRes] = await Promise.all([
        fetch(`/api/customers?${query}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
        fetch("/api/codes/details/by-group?group_code=SALES_STATUS"),
      ]);

      const cData = await cRes.json();
      setCustomers(Array.isArray(cData) ? cData : []);
      setUsers(await uRes.json());
      setConsultCodes(await cCodeRes.json());
      setSalesCodes(await sCodeRes.json());
    } catch (e) {
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, itemsPerPage, currentPage, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  const totalCommission = useMemo(
    () =>
      customers.reduce(
        (sum, customer) => sum + Number(customer.sales_commission || 0),
        0
      ),
    [customers]
  );

  const assignedTmCount = useMemo(
    () => customers.filter((customer) => !!customer.tm_id).length,
    [customers]
  );

  const assignedSalesCount = useMemo(
    () => customers.filter((customer) => !!customer.sales_id).length,
    [customers]
  );

  const selectedCount = selectedIds.length;

  const resultSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.search) parts.push("검색 적용");
    if (filters.tm_id !== "all") parts.push("TM 필터");
    if (filters.sales_id !== "all") parts.push("영업자 필터");
    if (filters.consult_status !== "all") parts.push("상담 상태");
    if (filters.sales_status !== "all") parts.push("영업 상태");
    if (filters.date_from || filters.date_to) parts.push("기간 필터");

    if (parts.length === 0) return `총 ${customers.length}건`;
    return `${parts.join(" · ")} · ${customers.length}건`;
  }, [filters, customers.length]);

  const toggleSelectAll = () => {
    if (
      selectedIds.length === paginatedData.length &&
      paginatedData.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (type: "TM" | "SALES") => {
    const assigneeId = type === "TM" ? assignTmId : assignSalesId;
    if (!assigneeId) {
      return showToast("배정할 담당자를 선택해주세요.", "error");
    }
    if (selectedIds.length === 0) {
      return showToast("고객을 먼저 선택해주세요.", "error");
    }

    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, type, assignee_id: assigneeId }),
      });

      if (res.ok) {
        showToast(`${selectedIds.length}명 일괄 배정 완료`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (e) {
      showToast("배정 중 오류 발생", "error");
    }
  };

  const downloadTemplate = () => {
    const row1 = "일괄 등록 주의 사항,,,,,";
    const row2 =
      '- 해당 파일의 형식을 임의 대로 수정하거나 필수값을 입력하지 않으시면 정상적으로 등록되지 않을 수 있습니다.,,,,,';
    const row3 =
      "- 공백이 포함된 행이 있는지 주의 부탁드립니다. 빈 값의 데이터 행이 등록될 수 있습니다.,,,,,";
    const row4 =
      '- 모든 항목의 셀 표시 형식(서식)이 "텍스트"로 설정된 것을 확인 후 파일을 업로드해 주세요.,,,,,';
    const header = "상담일자,업체명,대표자명,유선전화,핸드폰,주소,비고";
    const csvContent = "\ufeff" + [row1, row2, row3, row4, header].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "고객일괄등록_양식.csv";
    link.click();
  };

  const openModal = (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    setFormData(
      customer
        ? { ...customer }
        : { receipt_date: new Date().toISOString().split("T")[0] }
    );
    setIsModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setDeleteTarget(customer);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedCustomer
      ? `/api/customers/${selectedCustomer.id}`
      : "/api/customers";

    const res = await fetch(url, {
      method: selectedCustomer ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast("저장되었습니다.");
      fetchData();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        showToast("고객이 삭제되었습니다.");
        fetchData();
      } else {
        showToast("삭제 실패", "error");
      }
    } catch (error) {
      showToast("삭제 실패", "error");
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
                <Layers className="h-3.5 w-3.5" />
                고객 파이프라인
              </div>

              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                고객 관리
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                고객 접수부터 상담, 영업 배정, 정산 정보까지 한 화면에서 통합
                관리합니다. 운영 흐름을 빠르게 확인하고 즉시 대응할 수 있도록
                일관된 관리 시스템 구조로 정리했습니다.
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
                onClick={downloadTemplate}
                className="inline-flex h-14 items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1]"
              >
                <Download className="h-4.5 w-4.5" />
                양식 다운로드
              </button>

              <button
                type="button"
                className="inline-flex h-14 items-center gap-2 rounded-[20px] border border-emerald-400/15 bg-emerald-500/10 px-5 text-sm font-bold text-emerald-100 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/15"
              >
                <Upload className="h-4.5 w-4.5" />
                엑셀 업로드
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
            icon: Users,
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
            icon: BriefcaseBusiness,
            tone: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
          },
          {
            label: "누적 정산금액",
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

      {/* 통합 필터 / 배정 */}
      <section className="fade-up rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="grid items-start gap-3 xl:grid-cols-[180px_minmax(0,1fr)_260px]">
          <div className="relative self-start">
            <Filter className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
            <select
              value={filters.date_type}
              onChange={(e) =>
                setFilters({ ...filters, date_type: e.target.value })
              }
              className="h-14 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-0 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option>접수일</option>
              <option>상담일</option>
            </select>
          </div>

          <div className="grid items-start gap-3 md:grid-cols-[140px_auto_140px_minmax(0,1fr)]">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters({ ...filters, date_from: e.target.value })
              }
              className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="flex h-14 items-center justify-center text-slate-300 font-black">
              ~
            </div>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters({ ...filters, date_to: e.target.value })
              }
              className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="relative self-start group">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-600" />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="업체명, 대표자, 연락처 검색"
                className="h-14 w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 py-0 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="flex gap-2">
              <select
                value={assignTmId}
                onChange={(e) => setAssignTmId(e.target.value)}
                className="h-14 min-w-0 flex-1 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">TM 선택</option>
                {users
                  .filter((u) => u.role_name === "TM")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => handleBulkAssign("TM")}
                className="h-14 rounded-[20px] bg-slate-900 px-4 text-sm font-black text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
              >
                TM 배정
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={assignSalesId}
                onChange={(e) => setAssignSalesId(e.target.value)}
                className="h-14 min-w-0 flex-1 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="">영업사원 선택</option>
                {users
                  .filter((u) => u.role_name === "영업")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => handleBulkAssign("SALES")}
                className="h-14 rounded-[20px] bg-slate-900 px-4 text-sm font-black text-white transition-all hover:bg-violet-600 active:scale-[0.98]"
              >
                영업 배정
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <select
            value={filters.tm_id}
            onChange={(e) => setFilters({ ...filters, tm_id: e.target.value })}
            className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">담당 TM 전체</option>
            {users
              .filter((u) => u.role_name === "TM")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>

          <select
            value={filters.consult_status}
            onChange={(e) =>
              setFilters({ ...filters, consult_status: e.target.value })
            }
            className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">상담 상태 전체</option>
            {consultCodes.map((c) => (
              <option key={c.code_value} value={c.code_name}>
                {c.code_name}
              </option>
            ))}
          </select>

          <select
            value={filters.sales_id}
            onChange={(e) =>
              setFilters({ ...filters, sales_id: e.target.value })
            }
            className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
          >
            <option value="all">영업자 전체</option>
            {users
              .filter((u) => u.role_name === "영업")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>

          <select
            value={filters.sales_status}
            onChange={(e) =>
              setFilters({ ...filters, sales_status: e.target.value })
            }
            className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-0 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
          >
            <option value="all">영업 상태 전체</option>
            {salesCodes.map((s) => (
              <option key={s.code_value} value={s.code_name}>
                {s.code_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="h-14 rounded-[20px] border border-slate-200 bg-white px-5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
          >
            초기화
          </button>

          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-600">
            <Sparkles className="h-4 w-4" />
            {selectedCount > 0 ? `${selectedCount}건 선택됨` : resultSummary}
          </div>
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
                고객 기본정보와 상담/영업 상태를 빠르게 조회하고 수정할 수
                있습니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                실시간 반영
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={10}>10개씩</option>
                <option value={50}>50개씩</option>
                <option value={100}>100개씩</option>
                <option value={500}>500개씩</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="mt-3 space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-[24px] border border-slate-100 bg-slate-50/80 animate-pulse"
                />
              ))
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block w-full overflow-x-auto">
                  {paginatedData.length === 0 ? (
                    <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-800">
                        표시할 고객이 없습니다
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        검색 조건을 변경하거나 신규 고객을 등록해보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-[1580px] space-y-3">
                      <div className="grid items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3 text-[11px] font-bold tracking-[0.12em] text-slate-400 md:grid-cols-[52px_120px_minmax(240px,1.25fr)_120px_160px_minmax(240px,1fr)_110px_120px_140px_120px_140px]">
                        <span className="text-center">선택</span>
                        <span className="text-center">상담일자</span>
                        <span>업체 정보</span>
                        <span className="text-center">대표자명</span>
                        <span className="text-center">핸드폰</span>
                        <span>주소</span>
                        <span className="text-center">접수일</span>
                        <span className="text-center">담당 TM</span>
                        <span className="text-center">상담상태</span>
                        <span className="text-center">영업담당</span>
                        <span className="text-right">정산금액</span>
                      </div>

                      {paginatedData.map((c, index) => (
                        <div
                          key={c.id}
                          className={`group rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${
                            selectedIds.includes(c.id)
                              ? "border-blue-200 bg-blue-50/40"
                              : "border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80"
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="grid items-center gap-3 md:grid-cols-[52px_120px_minmax(240px,1.25fr)_120px_160px_minmax(240px,1fr)_110px_120px_140px_120px_140px]">
                            <div
                              className="flex justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(c.id)}
                                onChange={() => toggleSelect(c.id)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-bold text-slate-700 hover:text-blue-600"
                            >
                              {formatDate(c.consult_date)}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="min-w-0 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#13233F_0%,#0B1730_100%)] text-lg font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)]">
                                  {c.company_name?.[0] || "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900 group-hover:text-blue-600">
                                    {c.company_name || "업체명 없음"}
                                  </p>
                                  <p className="mt-1 truncate text-xs font-medium text-slate-400">
                                    내부 ID {c.id.split("-")[0]}
                                  </p>
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-bold text-slate-800"
                            >
                              {c.customer_name || "-"}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-bold text-blue-700 tabular-nums"
                            >
                              {c.mobile_phone || "-"}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="truncate text-left text-sm font-medium text-slate-500"
                            >
                              {c.address || "-"}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-semibold text-slate-700"
                            >
                              {formatDate(c.receipt_date)}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-bold text-slate-800"
                            >
                              {getUserNameById(c.tm_id)}
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="flex justify-center"
                            >
                              <span
                                className={`inline-flex min-w-[72px] justify-center whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-black leading-none ${getStatusTone(
                                  c.consult_status
                                )}`}
                              >
                                {c.consult_status || "대기"}
                              </span>
                            </button>

                            <button
                              onClick={() => openModal(c)}
                              className="text-center text-sm font-bold text-slate-800"
                            >
                              {getUserNameById(c.sales_id)}
                            </button>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openModal(c)}
                                className="text-right text-sm font-black text-blue-700 tabular-nums"
                              >
                                ₩{(c.sales_commission || 0).toLocaleString()}
                              </button>

                              <button
                                onClick={() => openDeleteModal(c)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`${c.company_name} 삭제`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-800">
                        표시할 고객이 없습니다
                      </h3>
                    </div>
                  ) : (
                    paginatedData.map((c) => (
                      <div
                        key={c.id}
                        className="space-y-3 p-4"
                        onClick={() => openModal(c)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(c.id);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#13233F_0%,#0B1730_100%)] text-base font-black text-white">
                              {c.company_name?.[0] || "C"}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {c.company_name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {c.customer_name || "-"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex min-w-[64px] justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black leading-none ${getStatusTone(
                              c.consult_status
                            )}`}
                          >
                            {c.consult_status || "대기"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                            상담일자 {formatDate(c.consult_date)}
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                            접수일 {formatDate(c.receipt_date)}
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                            TM {getUserNameById(c.tm_id)}
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                            영업 {getUserNameById(c.sales_id)}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          {c.mobile_phone || "-"} · {c.address || "주소 없음"}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-blue-700">
                            ₩{(c.sales_commission || 0).toLocaleString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(c);
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
            >
              {selectedIds.length === paginatedData.length && paginatedData.length > 0
                ? "선택 해제"
                : "현재 페이지 전체 선택"}
            </button>

            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 px-6">
                <span className="text-lg font-black tracking-tighter text-slate-950">
                  {currentPage}
                </span>
                <span className="font-bold text-slate-300">/</span>
                <span className="text-sm font-bold text-slate-400">
                  {totalPages}
                </span>
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 상세 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_40px_90px_rgba(15,23,42,0.25)] animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            <div className="custom-scrollbar flex-1 overflow-y-auto p-8 md:p-10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  <UserCheck className="h-3.5 w-3.5" />
                  고객 데이터 설정
                </div>

                <h2 className="mt-4 text-[2rem] font-black tracking-[-0.05em] text-slate-900">
                  {selectedCustomer ? "고객 정보 수정" : "신규 고객 등록"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  업체 정보와 상담/영업 진행 상황을 한 번에 관리합니다.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* 업체정보 */}
                  <section className="space-y-5 rounded-[30px] border border-slate-200 bg-slate-50/70 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-blue-600" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        업체 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          업체명
                        </label>
                        <input
                          required
                          value={formData.company_name || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company_name: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          대표자명
                        </label>
                        <input
                          value={formData.customer_name || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customer_name: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          휴대전화
                        </label>
                        <input
                          value={formData.mobile_phone || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mobile_phone: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-blue-700 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          유선전화
                        </label>
                        <input
                          value={formData.landline_phone || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              landline_phone: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          주소
                        </label>
                        <textarea
                          value={formData.address || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          className="h-28 w-full resize-none rounded-[22px] border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>
                  </section>

                  {/* 상담정보 */}
                  <section className="space-y-5 rounded-[30px] border border-emerald-100 bg-emerald-50/40 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        상담 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-emerald-700">
                          담당 TM
                        </label>
                        <select
                          value={formData.tm_id || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, tm_id: e.target.value })
                          }
                          className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
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
                          value={formData.consult_status || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consult_status: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                        >
                          {consultCodes.map((c) => (
                            <option key={c.code_value} value={c.code_name}>
                              {c.code_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-emerald-700">
                          상담일자
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.consult_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consult_date: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-emerald-700">
                          상담 메모
                        </label>
                        <textarea
                          value={formData.consult_memo || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consult_memo: e.target.value,
                            })
                          }
                          className="h-52 w-full resize-none rounded-[22px] border border-emerald-100 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                          placeholder="상담 이력을 입력하세요."
                        />
                      </div>
                    </div>
                  </section>

                  {/* 영업정보 */}
                  <section className="space-y-5 rounded-[30px] border border-violet-100 bg-violet-50/40 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-violet-500" />
                      <h3 className="text-sm font-black tracking-[0.12em] text-slate-900">
                        영업 정보
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-violet-700">
                          담당 영업사원
                        </label>
                        <select
                          value={formData.sales_id || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sales_id: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-violet-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
                        >
                          <option value="">미배정</option>
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
                        <label className="mb-2 block text-sm font-semibold text-violet-700">
                          영업 상태
                        </label>
                        <select
                          value={formData.sales_status || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sales_status: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-violet-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
                        >
                          {salesCodes.map((s) => (
                            <option key={s.code_value} value={s.code_name}>
                              {s.code_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-violet-700">
                          영업일자
                        </label>
                        <input
                          type="date"
                          value={formData.sales_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sales_date: e.target.value,
                            })
                          }
                          className="h-14 w-full rounded-2xl border border-violet-100 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-violet-700">
                          정산 수수료
                        </label>
                        <div className="relative">
                          <Wallet className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-violet-500" />
                          <input
                            type="number"
                            value={formData.sales_commission || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sales_commission: Number(e.target.value),
                              })
                            }
                            className="h-14 w-full rounded-2xl border border-violet-100 bg-white pl-12 pr-5 text-sm font-black text-violet-700 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-violet-700">
                          비고
                        </label>
                        <textarea
                          value={formData.note || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              note: e.target.value,
                            })
                          }
                          className="h-36 w-full resize-none rounded-[22px] border border-violet-100 bg-white p-5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
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
                {deleteTarget?.company_name || "-"}
              </span>
              {" / "}
              <span className="font-bold text-slate-800">
                {deleteTarget?.customer_name || "-"}
              </span>
              <br />
              고객 정보를 삭제하시겠습니까?
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
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
