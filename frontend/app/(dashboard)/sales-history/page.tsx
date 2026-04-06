"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
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
  UserCheck,
  Filter,
  Users,
  BriefcaseBusiness,
  Building2,
  User as UserIcon,
  Phone,
  MapPin,
} from "lucide-react";

// --- Interfaces ---
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

interface UserInfo {
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
  date_from: string;
  date_to: string;
  search: string;
  sales_id: string;
  sales_status: string;
};

export default function SalesManagementPage() {
  // --- 사용자 권한 설정 ---
  const [currentUser] = useState({ id: "user_sales_1", name: "영업담당A", role_name: "관리자" }); 
  const isAdmin = currentUser.role_name === "관리자";

  const INITIAL_FILTERS: FilterState = {
    date_from: "",
    date_to: "",
    search: "",
    sales_id: isAdmin ? "all" : currentUser.id,
    sales_status: "all",
  };

  // --- States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Utilities ---
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const formatDate = useCallback((val?: string | null) => {
    if (!val) return "-";
    return String(val).split("T")[0].replace(/-/g, ".");
  }, []);

  const getUserNameById = useCallback((id?: string | null) => {
    if (!id) return "미배정";
    return users.find((u) => u.id === id)?.name || "미배정";
  }, [users]);

  const getStatusTone = useCallback((v?: string) => {
    const text = (v || "").trim();
    if (/(완료|계약|성공|종결)/.test(text)) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (/(보류|취소|실패|부재)/.test(text)) return "bg-rose-50 text-rose-500 border-rose-100";
    return "bg-blue-50 text-blue-600 border-blue-100";
  }, []);

  const formatCommission = useCallback((value?: number | null) => {
    return `₩${Number(value || 0).toLocaleString()}`;
  }, []);

  // --- API Calls ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        date_type: "영업일",
        sales_id: isAdmin ? filters.sales_id : currentUser.id,
      }).toString();

      const [cRes, uRes, cCodeRes, sCodeRes] = await Promise.all([
        fetch(`/api/customers?${queryParams}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
        fetch("/api/codes/details/by-group?group_code=SALES_STATUS"),
      ]);

      const cData = await cRes.json();
      setCustomers(Array.isArray(cData) ? cData : cData?.data || []);
      setUsers(await uRes.json());
      setConsultCodes(await cCodeRes.json());
      setSalesCodes(await sCodeRes.json());
    } catch {
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAdmin, currentUser.id, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    // 상담 상태값이 정상적으로 표시되도록 데이터 확실히 매핑
    setFormData({ 
      ...customer, 
      consult_status: customer.consult_status || "" 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/customers/${selectedCustomer?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsModalOpen(false);
      showToast("영업 실적이 저장되었습니다.");
      fetchData();
    }
  };

  const confirmDelete = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setDeleteTarget(customer);
    setIsDeleteModalOpen(true);
  };

  const stats = useMemo(() => ({
    total: customers.length,
    completed: customers.filter(c => c.sales_status?.includes("완료")).length,
    totalCommission: customers.reduce((sum, c) => sum + Number(c.sales_commission || 0), 0)
  }), [customers]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-20 text-slate-900">
      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      )}

      {/* 1. 상단 헤더 */}
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
                영업 실적 시스템
              </div>

              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                영업 관리
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                실시간 영업 현황과 계약 진행 상태, 예상 수당 정보를 한 화면에서 통합
                관리합니다. 담당자별 성과 흐름을 빠르게 확인하고 즉시 대응할 수 있도록
                일관된 운영 화면 구조로 정리했습니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                aria-label="새로고침"
                type="button"
              >
                <RotateCw
                  className={`h-5 w-5 transition-transform duration-500 ${
                    isLoading ? "animate-spin" : "group-hover:rotate-180"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 통계 카드 */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "배정 고객수", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "계약 완료", value: stats.completed, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "예상 수당 총액", value: formatCommission(stats.totalCommission), icon: Wallet, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stat.value.toString().padStart(2, '0')}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </section>

      {/* 3. 필터 바 */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-500 border border-slate-100">
            <Filter className="h-4 w-4" /> 영업일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold focus:border-blue-500 outline-none" />
            <div className="flex h-[52px] items-center justify-center text-slate-400 font-bold">~</div>
            <input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold focus:border-blue-500 outline-none" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="업체명, 대표자 검색" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-5 text-sm font-bold focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          {isAdmin ? (
            <select
              value={filters.sales_id}
              onChange={(e) => setFilters({ ...filters, sales_id: e.target.value })}
              className="app-select app-select-md w-full"
            >
              <option value="all">담당 영업원 전체</option>
              {users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          ) : (
            <div className="h-[52px] flex items-center px-5 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 border border-slate-100">
              <Users className="h-4 w-4 mr-2 text-blue-500" /> {currentUser.name} (본인 배정건)
            </div>
          )}
          <select
            value={filters.sales_status}
            onChange={(e) => setFilters({ ...filters, sales_status: e.target.value })}
            className="app-select app-select-md w-full"
          >
            <option value="all">영업 상태 전체</option>
            {salesCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
          </select>
          <button onClick={() => setFilters(INITIAL_FILTERS)} className="h-[52px] rounded-2xl px-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">초기화</button>
          <div className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#1e232d] px-6 text-sm font-bold text-white shadow-lg">
            <Sparkles className="h-4 w-4 text-blue-400" /> 검색 {customers.length}건
          </div>
        </div>
      </section>

      {/* 4. 데이터 레지스트리 (행 클릭 활성화) */}
      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-6">
          <h2 className="text-[1.1rem] font-bold text-slate-900 tracking-tight">영업 데이터 레지스트리</h2>
        </div>
        <div className="p-4 md:p-8 overflow-x-auto">
          <div className="min-w-[1500px] space-y-2">
            <div className="grid grid-cols-[120px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px_60px] gap-6 px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <span className="text-center">영업일자</span>
              <span>업체명</span>
              <span className="text-center">대표자</span>
              <span className="text-center">연락처</span>
              <span className="text-center">담당영업원</span>
              <span className="text-center">영업상태</span>
              <span className="text-center">상담상태</span>
              <span>영업 메모</span>
              <span className="text-right">수당</span>
              <span className="text-center">삭제</span>
            </div>
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-50" />)
            ) : paginatedData.map((c) => (
              <div key={c.id} onClick={() => openModal(c)} className="group grid grid-cols-[120px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px_60px] items-center gap-6 rounded-2xl border border-slate-50 bg-white p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-center text-sm font-bold text-slate-500">{formatDate(c.sales_date)}</div>
                <div className="font-black text-slate-900 text-base truncate">{c.company_name}</div>
                <div className="text-center text-sm font-semibold">{c.customer_name || "-"}</div>
                <div className="text-center text-sm font-semibold">{c.mobile_phone || "-"}</div>
                <div className="text-center text-sm font-bold text-blue-600">{getUserNameById(c.sales_id)}</div>
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full border text-[11px] font-black ${getStatusTone(c.sales_status)}`}>{c.sales_status || "진행중"}</span>
                </div>
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full border text-[11px] font-black ${getStatusTone(c.consult_status)}`}>{c.consult_status || "상담 대기"}</span>
                </div>
                <div className="text-sm text-slate-600 truncate font-medium">{c.sales_memo || "-"}</div>
                <div className="text-right text-sm font-black text-slate-900">{formatCommission(c.sales_commission)}</div>
                <div className="flex justify-center">
                  <button onClick={(e) => confirmDelete(e, c)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total {customers.length} Items</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronLeft className="h-5 w-5"/></button>
            <div className="px-4 py-2 rounded-xl bg-[#1e232d] text-sm font-bold text-white">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronRight className="h-5 w-5"/></button>
          </div>
        </div>
      </section>

      {/* 5. 상세 관리 모달 (고객 정보 노출 & 상담상태 매핑 보완) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-xl scale-in">
          <div className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-10 md:p-12 text-slate-900">
              <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600 border border-blue-100 uppercase tracking-widest">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> 영업 성과 상세
                  </div>
                  <h2 className="text-3xl font-black">{selectedCustomer?.company_name}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                {/* [상단: 고객 정보 섹션] */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Building2 className="h-3 w-3"/> 업체명</label>
                    <p className="font-bold text-sm">{selectedCustomer?.company_name || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><UserIcon className="h-3 w-3"/> 대표자</label>
                    <p className="font-bold text-sm">{selectedCustomer?.customer_name || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Phone className="h-3 w-3"/> 연락처</label>
                    <p className="font-bold text-sm">{selectedCustomer?.mobile_phone || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin className="h-3 w-3"/> 주소</label>
                    <p className="font-bold text-sm truncate" title={selectedCustomer?.address}>{selectedCustomer?.address || "-"}</p>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* [좌측: 상담 정보 - 관리자 수정 / 영업 읽기전용] */}
                  <div className={`p-8 rounded-[30px] border ${isAdmin ? 'border-blue-100 bg-blue-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6">상담 이력 {!isAdmin && "(읽기전용)"}</h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">상담 상태</label>
                        <select
                          disabled={!isAdmin}
                          value={formData.consult_status || ""}
                          onChange={(e) => setFormData({ ...formData, consult_status: e.target.value })}
                          className="app-select app-select-md w-full"
                        >
                          <option value="">상태 미지정</option>
                          {consultCodes.map(c => (
                            <option key={c.code_value} value={c.code_name}>{c.code_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">상담 메모</label>
                        <textarea 
                          readOnly={!isAdmin} 
                          value={formData.consult_memo || ""} 
                          onChange={e => setFormData({...formData, consult_memo: e.target.value})} 
                          className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-5 font-bold text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* [우측: 영업 성과 입력 섹션 - 수당 숫자 처리] */}
                  <div className="p-8 rounded-[30px] border border-emerald-100 bg-emerald-50/10 shadow-sm">
                    <h3 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-6 text-emerald-700">영업 성과 기록</h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">영업 상태</label>
                          <select
                            value={formData.sales_status || ""}
                            onChange={(e) => setFormData({ ...formData, sales_status: e.target.value })}
                            className="app-select app-select-md w-full"
                          >
                            <option value="">상태 선택</option>
                            {salesCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">영업일자</label>
                          <input type="date" value={formData.sales_date || ""} onChange={e => setFormData({...formData, sales_date: e.target.value})} className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-5 font-bold text-slate-900 outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">정산 수당 (₩)</label>
                        <input 
                          type="number" 
                          value={formData.sales_commission === 0 ? "" : formData.sales_commission} 
                          onChange={e => setFormData({...formData, sales_commission: e.target.value ? Number(e.target.value) : 0})} 
                          placeholder="수당을 입력하세요 (숫자만)"
                          className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-5 font-black text-emerald-600 outline-none focus:border-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">영업 비고</label>
                        <textarea value={formData.sales_memo || ""} onChange={e => setFormData({...formData, sales_memo: e.target.value})} placeholder="상세 계약 내용 및 특이사항..." className="min-h-[100px] w-full rounded-2xl border border-emerald-200 bg-white p-5 font-bold text-slate-900 outline-none focus:ring-2 ring-emerald-500/20 leading-relaxed" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 flex-1 rounded-2xl border border-slate-200 font-bold text-slate-400 hover:bg-slate-50 transition-all">취소</button>
                  <button type="submit" className="h-14 flex-[2] rounded-2xl bg-[#1e232d] font-black text-white shadow-xl hover:bg-black transition-all">성과 업데이트 완료</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-10 text-center shadow-2xl scale-in">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-rose-50 text-rose-500 shadow-inner"><AlertTriangle className="h-10 w-10" /></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">기록 삭제</h3>
            <p className="mt-4 text-sm font-medium text-slate-400 leading-relaxed">이 영업 내역을 삭제하시겠습니까? <br/>삭제된 데이터는 복구할 수 없습니다.</p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={async () => {
                if (!deleteTarget) return;
                const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
                if (res.ok) { setIsDeleteModalOpen(false); showToast("삭제 완료"); fetchData(); }
              }} className="h-14 rounded-2xl bg-rose-600 font-black text-white hover:bg-rose-700 transition-all">삭제 확인</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}