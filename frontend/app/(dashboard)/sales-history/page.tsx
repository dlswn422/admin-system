"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Wallet,
  UserCheck,
  Filter,
  Users,
  BriefcaseBusiness,
  Building2,
  User as UserIcon,
  Phone,
  MapPin,
  FileAudio,
  ExternalLink,
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

interface RecordingItem {
  id: string;
  customer_id: string;
  file_name: string;
  file_url: string;
  created_at?: string;
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
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // --- States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    search: "",
    sales_id: "",
    sales_status: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // --- API 호출 로직 ---
  const fetchData = useCallback(async (userOverride?: UserInfo) => {
    const activeUser = userOverride || currentUser;
    if (!activeUser) return;

    setIsLoading(true);
    try {
      const params: Record<string, string> = { date_type: "영업일" };
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      if (filters.sales_status && filters.sales_status !== "all") params.sales_status = filters.sales_status;

      const roleName = activeUser.role_name || (activeUser as any).role;
      const userId = activeUser.id;

      if (roleName !== "관리자") {
        params.sales_id = String(userId);
      } else if (filters.sales_id && filters.sales_id !== "all") {
        params.sales_id = filters.sales_id;
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val && val !== "undefined" && val !== "null") queryParams.append(key, val);
      });

      const [cRes, uRes, cCodeRes, sCodeRes] = await Promise.all([
        fetch(`/api/customers?${queryParams.toString()}`),
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
  }, [filters, currentUser]);

  // --- 초기 실행: 유저 정보 로드 ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        
        const roleName = parsedUser.role_name || parsedUser.role;
        const userId = parsedUser.id;

        if (roleName !== "관리자" && userId) {
          setFilters(prev => ({ ...prev, sales_id: String(userId) }));
        }
        fetchData(parsedUser);
      } catch (e) {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  // 필터 변경 시 실행
  useEffect(() => {
    if (currentUser) fetchData();
  }, [filters.date_from, filters.date_to, filters.search, filters.sales_id, filters.sales_status]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRecordings = async (customerId: string) => {
    setIsRecordingsLoading(true);
    try {
      const res = await fetch(`/api/recordings/upload?customer_id=${customerId}`);
      const data = await res.json();
      setRecordings(Array.isArray(data) ? data : []);
    } catch {
      setRecordings([]);
    } finally {
      setIsRecordingsLoading(false);
    }
  };

  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
    await fetchRecordings(customer.id);
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
      showToast("영업 실적이 반영되었습니다.");
      fetchData();
    }
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

  // --- 영업 담당자용 필터링된 옵션 ---
  const filteredSalesCodes = useMemo(() => {
    const roleName = currentUser?.role_name || (currentUser as any)?.role;
    if (roleName === "관리자") return salesCodes;
    
    // 영업 담당자에게만 허용할 상태값 리스트
    const allowedStatus = ["방문 전", "관리", "거절", "조회 요청"];
    return salesCodes.filter(code => allowedStatus.includes(code.code_name));
  }, [salesCodes, currentUser]);

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-20 text-slate-900">
      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      )}

      {/* 헤더 */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#1e232d] px-10 py-8 shadow-xl">
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                <Layers className="h-3 w-3" /> 영업 성과 통합 관리
              </div>
              <h1 className="text-[2.2rem] font-black leading-none tracking-tight text-white">영업 관리</h1>
              <p className="text-slate-400 text-sm">확정된 상담 건을 바탕으로 영업 실적을 관리합니다.</p>
            </div>
            <button onClick={() => fetchData()} className="h-11 w-11 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">
              <RotateCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 통계 카드 */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "배정 고객수", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "계약 완료", value: stats.completed, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "매출 총액", value: `₩${stats.totalCommission.toLocaleString()}`, icon: Wallet, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </section>

      {/* 필터 바 */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-500 border border-slate-100">
            <Filter className="h-4 w-4" /> 영업일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
            <div className="flex h-[52px] items-center justify-center text-slate-400 font-bold">~</div>
            <input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="업체명, 대표자 검색" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <select disabled={(currentUser.role_name || (currentUser as any).role) !== "관리자"} value={filters.sales_id || "all"} onChange={e => setFilters({...filters, sales_id: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50">
            {(currentUser.role_name || (currentUser as any).role) === "관리자" ? (
              <>
                <option value="all">담당 영업원 전체</option>
                {users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </>
            ) : <option value={currentUser.id}>{currentUser.name}</option>}
          </select>
          <select value={filters.sales_status} onChange={e => setFilters({...filters, sales_status: e.target.value})} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
            <option value="all">영업 상태 전체</option>
            {salesCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
          </select>
          <button onClick={() => setFilters(prev => ({ ...prev, date_from: "", date_to: "", search: "", sales_status: "all" }))} className="h-[52px] rounded-2xl px-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">초기화</button>
          <div className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#1e232d] px-6 text-sm font-bold text-white shadow-lg">
            <Sparkles className="h-4 w-4 text-blue-400" /> 검색 {customers.length}건
          </div>
        </div>
      </section>

      {/* 테이블 */}
      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 overflow-x-auto">
          <div className="min-w-[1400px] space-y-2">
            <div className="grid grid-cols-[120px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px] gap-6 px-8 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <span className="text-center">영업일자</span><span>업체명</span><span className="text-center">대표자</span><span className="text-center">연락처</span><span className="text-center">담당영업원</span><span className="text-center">영업상태</span><span className="text-center">상담상태</span><span>영업 메모</span><span className="text-right">매출</span>
            </div>
            {isLoading ? [1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-50" />) : 
             paginatedData.map((c) => (
              <div key={c.id} onClick={() => openModal(c)} className="group grid grid-cols-[120px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px] items-center gap-6 rounded-2xl border border-slate-50 bg-white p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-center text-sm font-bold text-slate-500">{c.sales_date?.split('T')[0] || "-"}</div>
                <div className="font-black text-slate-900 text-base truncate">{c.company_name}</div>
                <div className="text-center text-sm font-semibold">{c.customer_name || "-"}</div>
                <div className="text-center text-sm font-semibold">{c.mobile_phone || "-"}</div>
                <div className="text-center text-sm font-bold text-blue-600">{users.find(u => u.id === c.sales_id)?.name || "미배정"}</div>
                <div className="flex justify-center"><span className="px-3 py-1 rounded-full border text-[11px] font-black bg-emerald-50 text-emerald-600">{c.sales_status || "진행중"}</span></div>
                <div className="flex justify-center"><span className="px-3 py-1 rounded-full border text-[11px] font-black bg-blue-50 text-blue-600">{c.consult_status || "상담완료"}</span></div>
                <div className="text-sm text-slate-600 truncate font-medium">{c.sales_memo || "-"}</div>
                <div className="text-right text-sm font-black text-slate-900">₩{(c.sales_commission || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total {customers.length} Items</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border border-slate-200 disabled:opacity-20"><ChevronLeft className="h-5 w-5"/></button>
            <div className="px-4 py-2 rounded-xl bg-[#1e232d] text-sm font-bold text-white">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border border-slate-200 disabled:opacity-20"><ChevronRight className="h-5 w-5"/></button>
          </div>
        </div>
      </section>

      {/* 상세 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-10 md:p-12 text-slate-900">
              <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600 border border-blue-100 uppercase tracking-widest">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> 영업 성과 및 이력 확인
                  </div>
                  <h2 className="text-3xl font-black">{selectedCustomer?.company_name}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-slate-50 rounded-[30px] border border-slate-100">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest"><Building2 className="h-3.5 w-3.5"/> 업체명</label>
                    <input readOnly value={selectedCustomer?.company_name || ""} className="w-full bg-transparent border-none font-bold text-slate-800 outline-none cursor-default" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest"><UserIcon className="h-3.5 w-3.5"/> 대표자</label>
                    <input readOnly value={selectedCustomer?.customer_name || ""} className="w-full bg-transparent border-none font-bold text-slate-800 outline-none cursor-default" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest"><Phone className="h-3.5 w-3.5"/> 연락처</label>
                    <input readOnly value={selectedCustomer?.mobile_phone || ""} className="w-full bg-transparent border-none font-bold text-slate-800 outline-none cursor-default" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest"><MapPin className="h-3.5 w-3.5"/> 주소</label>
                    <input readOnly value={selectedCustomer?.address || ""} className="w-full bg-transparent border-none font-bold text-slate-800 outline-none cursor-default truncate" />
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[30px] border border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" /> 상담팀 전달 사항 (읽기 전용)
                    </h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">상담 상태</label>
                        <div className="h-12 w-full flex items-center px-5 rounded-2xl border border-slate-200 bg-slate-100 font-bold text-slate-500">
                          {selectedCustomer?.consult_status || "상담 완료"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">상담 메모</label>
                        <div className="min-h-[120px] w-full p-5 rounded-2xl border border-slate-200 bg-slate-100 font-medium text-slate-500 whitespace-pre-wrap leading-relaxed">
                          {selectedCustomer?.consult_memo || "기록된 상담 메모가 없습니다."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[30px] border border-emerald-100 bg-emerald-50/10 shadow-sm">
                    <h3 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-6">영업 성과 기록 (성과 업데이트)</h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업 상태</label>
                          <select 
                            value={formData.sales_status || ""} 
                            onChange={e => setFormData({...formData, sales_status: e.target.value})} 
                            className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-5 font-bold text-slate-900 outline-none focus:ring-2 ring-emerald-500/20"
                          >
                            <option value="">상태 선택</option>
                            {/* 필터링된 옵션 적용 */}
                            {filteredSalesCodes.map(c => (
                              <option key={c.code_value} value={c.code_name}>{c.code_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업일자</label>
                          <input type="date" value={formData.sales_date?.split('T')[0] || ""} onChange={e => setFormData({...formData, sales_date: e.target.value})} className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-5 font-bold text-slate-900 outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">정산 매출 (₩)</label>
                        <input type="number" value={formData.sales_commission || ""} onChange={e => setFormData({...formData, sales_commission: Number(e.target.value)})} placeholder="매출액을 입력하세요" className="h-12 w-full rounded-2xl border border-emerald-200 bg-white px-5 font-black text-emerald-600 outline-none focus:border-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업 비고</label>
                        <textarea value={formData.sales_memo || ""} onChange={e => setFormData({...formData, sales_memo: e.target.value})} placeholder="계약 상세 정보 및 영업 특이사항을 기록하세요..." className="min-h-[100px] w-full rounded-2xl border border-emerald-200 bg-white p-5 font-bold text-slate-900 outline-none focus:ring-2 ring-emerald-500/20 leading-relaxed" />
                      </div>
                    </div>
                  </div>
                </div>

                <section className="rounded-[30px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-6"><FileAudio className="h-5 w-5" /> 상담 녹취 자료 (다운로드 전용)</h3>
                  <div className="grid gap-3">
                    {isRecordingsLoading ? <div className="h-12 animate-pulse bg-white rounded-xl" /> :
                     recordings.length === 0 ? <div className="py-10 text-center text-xs font-bold text-slate-300">등록된 녹취 자료가 없습니다.</div> : 
                     recordings.map(r => (
                      <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileAudio className="h-5 w-5" /></div>
                          <span className="max-w-[300px] truncate text-sm font-bold text-slate-700">{r.file_name}</span>
                        </div>
                        <a href={r.file_url} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-xl border px-5 text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all">
                          <ExternalLink className="h-3.5 w-3.5" /> 다운로드 / 열기
                        </a>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-16 flex-1 rounded-2xl border border-slate-200 font-bold text-slate-400 hover:bg-slate-50 transition-all">닫기</button>
                  <button type="submit" className="h-16 flex-[2] rounded-2xl bg-[#1e232d] font-black text-white shadow-xl hover:bg-black transition-all">영업 성과 업데이트 완료</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}