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
  TrendingUp,
  Award,
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
  const [allSalesDataForRank, setAllSalesDataForRank] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    search: "",
    sales_id: "all",
    sales_status: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
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
      const roleName = activeUser.role_name || (activeUser as any).role;
      const listParams = new URLSearchParams({ date_type: "영업일" });
      if (filters.date_from) listParams.append("date_from", filters.date_from);
      if (filters.date_to) listParams.append("date_to", filters.date_to);
      if (filters.search) listParams.append("search", filters.search);
      if (filters.sales_status !== "all") listParams.append("sales_status", filters.sales_status);
      
      if (roleName !== "관리자") {
        listParams.append("sales_id", String(activeUser.id));
      } else if (filters.sales_id !== "all") {
        listParams.append("sales_id", filters.sales_id);
      }

      const rankParams = new URLSearchParams({ date_type: "영업일" });
      if (filters.date_from) rankParams.append("date_from", filters.date_from);
      if (filters.date_to) rankParams.append("date_to", filters.date_to);

      const [cRes, rRes, uRes, sCodeRes] = await Promise.all([
        fetch(`/api/customers?${listParams.toString()}`),
        fetch(`/api/customers?${rankParams.toString()}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=SALES_STATUS"),
      ]);

      const cData = await cRes.json();
      const rData = await rRes.json();
      setCustomers(Array.isArray(cData) ? cData : cData?.data || []);
      setAllSalesDataForRank(Array.isArray(rData) ? rData : rData?.data || []);
      setUsers(await uRes.json());
      setSalesCodes(await sCodeRes.json());
    } catch {
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        fetchData(parsedUser);
      } catch { window.location.href = "/login"; }
    } else { window.location.href = "/login"; }
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [filters.date_from, filters.date_to, filters.search, filters.sales_id, filters.sales_status]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    // 날짜는 년월일만 표시하기 위해 파싱
    const formattedDate = customer.sales_date ? customer.sales_date.split('T')[0] : "";
    setFormData({ ...customer, sales_date: formattedDate });
    setIsModalOpen(true);
    setIsRecordingsLoading(true);
    try {
      const res = await fetch(`/api/recordings/upload?customer_id=${customer.id}`);
      const data = await res.json();
      setRecordings(Array.isArray(data) ? data : []);
    } catch { setRecordings([]); }
    finally { setIsRecordingsLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    // --- 유효성 검사 (필수값 체크) ---
    if (!formData.sales_status || formData.sales_status === "") {
        return showToast("영업 진행 상태를 선택해주세요.", "error");
    }
    if (!formData.sales_date || formData.sales_date === "") {
        return showToast("영업 실행 일자를 선택해주세요.", "error");
    }
    if (formData.sales_commission === undefined || formData.sales_commission === null) {
        return showToast("정산 수당을 입력해주세요.", "error");
    }

    // 전송 데이터 가공
    const submissionData = { 
        ...formData,
        // 빈 문자열일 경우 DB 에러 방지를 위해 null 처리
        sales_date: formData.sales_date || null 
    };

    try {
        const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });
        if (res.ok) {
          setIsModalOpen(false);
          showToast("영업 실적이 반영되었습니다.", "success");
          fetchData();
        } else {
            const err = await res.json();
            showToast(err.error || "반영 실패", "error");
        }
    } catch {
        showToast("네트워크 오류가 발생했습니다.", "error");
    }
  };

  const salesRankings = useMemo(() => {
    const salesUsers = users.filter(u => u.role_name === "영업" || (u as any).role === "영업");
    return salesUsers.map(u => {
      const userSales = allSalesDataForRank.filter(c => String(c.sales_id) === String(u.id));
      const total = userSales.reduce((sum, c) => sum + Number(c.sales_commission || 0), 0);
      return { id: u.id, name: u.name, total, count: userSales.length };
    }).sort((a, b) => b.total - a.total);
  }, [users, allSalesDataForRank]);

  const stats = useMemo(() => ({
    total: customers.length,
    completed: customers.filter(c => c.sales_status?.includes("완료")).length,
    totalCommission: customers.reduce((sum, c) => sum + Number(c.sales_commission || 0), 0)
  }), [customers]);

  const filteredSalesCodes = useMemo(() => {
    const role = currentUser?.role_name || (currentUser as any)?.role;
    if (role === "관리자") return salesCodes;
    return salesCodes.filter(c => ["방문 전", "관리", "거절", "조회 요청", "방문 약속"].includes(c.code_name));
  }, [salesCodes, currentUser]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-20 text-slate-900">
      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      )}

      {/* 헤더 섹션 */}
      <section>
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#1e232d] px-10 py-8 shadow-xl">
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                <Layers className="h-3.5 w-3.5" /> 영업 성과 통합 관리
              </div>
              <h1 className="text-[2.4rem] font-black leading-none tracking-tight text-white">영업 관리</h1>
              <p className="text-slate-400 text-[15px]">영업 활동 내역 및 수당 정산 현황을 실시간으로 관리합니다.</p>
            </div>
            <button onClick={() => fetchData()} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all shadow-inner">
              <RotateCw className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 통계 요약 카드 */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "담당 고객", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "계약 성공", value: stats.completed, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          { label: "누적 수당", value: `₩${stats.totalCommission.toLocaleString()}`, icon: Wallet, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="mt-2 text-[1.8rem] font-black text-slate-900">{stat.value}</p>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.color}`}>
              <stat.icon className="h-7 w-7" />
            </div>
          </div>
        ))}
        <button onClick={() => setIsRankModalOpen(true)} className="flex items-center justify-between rounded-[28px] border border-rose-100 bg-rose-50/30 p-8 shadow-sm hover:bg-rose-50 transition-all group">
          <div className="text-left">
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest">매출 성과</p>
            <p className="mt-2 text-[1.8rem] font-black text-rose-600">실적 랭킹</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform"><TrendingUp className="h-7 w-7" /></div>
        </button>
      </section>

      {/* 검색 및 필터 컨트롤 */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-500">
            <Filter className="h-4 w-4" /> 영업일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none shadow-inner" />
            <div className="flex h-14 items-center justify-center text-slate-400 font-black">~</div>
            <input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none shadow-inner" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="업체명 및 고객명 검색" className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-5 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none shadow-inner" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <select disabled={(currentUser.role_name || (currentUser as any).role) !== "관리자"} value={filters.sales_id || "all"} onChange={e => setFilters({...filters, sales_id: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none disabled:bg-slate-50 shadow-inner">
            {(currentUser.role_name || (currentUser as any).role) === "관리자" ? (
              <>
                <option value="all">담당 영업원 전체</option>
                {users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </>
            ) : <option value={currentUser.id}>{currentUser.name}</option>}
          </select>
          <select value={filters.sales_status} onChange={e => setFilters({...filters, sales_status: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none shadow-inner">
            <option value="all">영업 상태 전체</option>
            {salesCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
          </select>
          <button onClick={() => setFilters({ date_from: "", date_to: "", search: "", sales_id: "all", sales_status: "all" })} className="h-14 px-8 border-2 border-slate-200 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">필터 초기화</button>
          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#1e232d] px-6 text-sm font-bold text-white shadow-lg">
            <Sparkles className="h-4 w-4 text-blue-400" /> 데이터 {customers.length}건
          </div>
        </div>
      </section>

      {/* 데이터 테이블 리스트 */}
      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 overflow-x-auto">
          <div className="min-w-[1400px] space-y-3">
            <div className="grid grid-cols-[130px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px] gap-6 px-8 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <span className="text-center">영업일자</span><span>업체명</span><span className="text-center">대표자</span><span className="text-center">연락처</span><span className="text-center">영업자</span><span className="text-center">영업상태</span><span className="text-center">상담상태</span><span>영업 메모</span><span className="text-right">수당</span>
            </div>
            {isLoading ? [1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-50" />) : 
             paginatedData.map((c) => (
                <div key={c.id} onClick={() => openModal(c)} className="group grid grid-cols-[130px_180px_110px_140px_120px_110px_110px_minmax(200px,1fr)_110px] items-center gap-6 rounded-[24px] border border-slate-50 bg-white p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="text-center text-sm font-black text-slate-500">{c.sales_date?.split('T')[0] || "-"}</div>
                  <div className="font-black text-slate-900 text-base truncate">{c.company_name}</div>
                  <div className="text-center text-sm font-bold">{c.customer_name || "-"}</div>
                  <div className="text-center text-sm font-medium text-slate-500">{c.mobile_phone || "-"}</div>
                  <div className="text-center text-sm font-black text-blue-600">{users.find(u => u.id === c.sales_id)?.name || "미배정"}</div>
                  <div className="flex justify-center"><span className="px-4 py-1.5 rounded-full border text-[10px] font-black bg-emerald-50 text-emerald-600">{c.sales_status || "진행중"}</span></div>
                  <div className="flex justify-center"><span className="px-4 py-1.5 rounded-full border text-[10px] font-black bg-blue-50 text-blue-600">{c.consult_status || "상담완료"}</span></div>
                  <div className="text-sm text-slate-600 truncate font-medium">{c.sales_memo || "기록 없음"}</div>
                  <div className="text-right text-sm font-black text-slate-900">₩{(c.sales_commission || 0).toLocaleString()}</div>
                </div>
              )
             )}
          </div>
        </div>
        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total {customers.length} Items Displayed</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-xl border-2 border-slate-100 bg-white disabled:opacity-20 hover:bg-slate-50 transition-all"><ChevronLeft className="h-5 w-5"/></button>
            <div className="px-6 py-3 rounded-xl bg-[#1e232d] text-sm font-black text-white shadow-lg">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-xl border-2 border-slate-100 bg-white disabled:opacity-20 hover:bg-slate-50 transition-all"><ChevronRight className="h-5 w-5"/></button>
          </div>
        </div>
      </section>

      {/* 영업 상세 정보 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[40px] bg-white shadow-2xl flex flex-col border border-slate-200">
            <div className="overflow-y-auto p-12 md:p-14">
              <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-10">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black text-blue-600 border border-blue-100 uppercase tracking-widest"><BriefcaseBusiness className="h-4 w-4" /> 실적 업데이트 모드</div>
                  <h2 className="text-4xl font-black text-slate-900">{selectedCustomer?.company_name}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="h-6 w-6"/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-10">
                {/* 업체 기본 정보 (비활성화 상태) */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 font-black text-slate-400"><div className="h-4 w-1 bg-slate-300 rounded-full" /> 업체 기본 정보 (조회 전용)</div>
                  <div className="grid gap-5 md:grid-cols-3">
                    {[
                      { label: "업체명", field: "company_name" },
                      { label: "대표자명", field: "customer_name" },
                      { label: "핸드폰 번호", field: "mobile_phone" },
                      { label: "유선 번호", field: "landline_phone" },
                    ].map(item => (
                      <div key={item.field} className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
                        <input 
                            readOnly 
                            value={(formData as any)[item.field] || ""} 
                            className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 font-bold text-slate-400 cursor-not-allowed outline-none shadow-sm" 
                        />
                      </div>
                    ))}
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">상세 주소 (ADDRESS)</label>
                      <textarea 
                        readOnly 
                        value={formData.address || ""} 
                        className="min-h-[80px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-6 font-bold text-slate-400 cursor-not-allowed outline-none resize-none shadow-sm" 
                      />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* 상담팀 전달 사항 섹션 */}
                  <div className="p-10 rounded-[35px] border-2 border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck className="h-5 w-5" /> 상담팀 기록 사항</h3>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase">상담 완료 일시</span>
                            <span className="text-sm font-black text-blue-600">{selectedCustomer?.consult_date?.replace("T", " ").slice(0, 16) || "미지정"}</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">상담 진행 상태</label>
                        <div className="h-14 w-full flex items-center px-6 rounded-2xl border-2 border-slate-200 bg-slate-100 font-black text-slate-500">{selectedCustomer?.consult_status || "상담 완료"}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">상담 메모 내용</label>
                        <div className="min-h-[180px] w-full p-7 rounded-[28px] border-2 border-slate-200 bg-slate-100 font-bold text-slate-500 whitespace-pre-wrap leading-relaxed">{selectedCustomer?.consult_memo || "기록된 상담 내용이 없습니다."}</div>
                      </div>
                    </div>
                  </div>

                  {/* 영업 성과 업데이트 섹션 */}
                  <div className="p-10 rounded-[35px] border-2 border-emerald-100 bg-emerald-50/10 shadow-sm">
                    <h3 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp className="h-5 w-5"/> 영업 성과 업데이트</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업 진행 상태 <span className="text-rose-500">*</span></label>
                          <select value={formData.sales_status || ""} onChange={e => setFormData({...formData, sales_status: e.target.value})} className="h-14 w-full rounded-2xl border-2 border-emerald-200 bg-white px-6 font-black text-slate-900 outline-none focus:ring-4 ring-emerald-500/10 transition-all">
                            <option value="">상태 선택</option>
                            {filteredSalesCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업 실행 일자 <span className="text-rose-500">*</span></label>
                          <input type="date" value={formData.sales_date || ""} onChange={e => setFormData({...formData, sales_date: e.target.value})} className="h-14 w-full rounded-2xl border-2 border-emerald-200 bg-white px-6 font-black text-slate-900 outline-none focus:border-emerald-500 shadow-inner" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">정산 영업 수당 (₩) <span className="text-rose-500">*</span></label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-lg">₩</span>
                           <input type="number" value={formData.sales_commission || ""} onChange={e => setFormData({...formData, sales_commission: Number(e.target.value)})} placeholder="매출액을 숫자로만 입력하세요" className="h-16 w-full rounded-2xl border-2 border-emerald-200 bg-white pl-12 pr-6 font-black text-[1.4rem] text-emerald-600 outline-none focus:ring-4 ring-emerald-500/10 shadow-inner" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1">영업 성과 비고</label>
                        <textarea value={formData.sales_memo || ""} onChange={e => setFormData({...formData, sales_memo: e.target.value})} placeholder="상세한 영업 활동 내역을 기록하세요." className="min-h-[120px] w-full rounded-[24px] border-2 border-emerald-200 bg-white p-6 font-bold text-slate-900 outline-none focus:ring-4 ring-emerald-500/10" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 버튼 제어 */}
                <div className="flex gap-5 pt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-18 flex-1 rounded-[22px] border-2 border-slate-200 font-black text-slate-400 hover:bg-slate-50 transition-all text-lg shadow-sm">창 닫기</button>
                  <button type="submit" className="h-18 flex-[2.5] rounded-[22px] bg-[#1e232d] font-black text-white shadow-2xl hover:bg-black transition-all text-lg flex items-center justify-center gap-3">
                    영업 실적 업데이트 저장하기 <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 영업자 실적 랭킹 모달 */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-[40px] bg-white shadow-2xl p-12 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-1.5 text-[10px] font-black text-rose-600 border border-rose-100 uppercase tracking-widest mb-3"><Award className="h-4 w-4" /> Performance Rankings</div>
                <h2 className="text-3xl font-black text-slate-900">영업자 실적 랭킹</h2>
              </div>
              <button onClick={() => setIsRankModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X /></button>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {salesRankings.map((r, i) => (
                <div key={r.id} className={`flex items-center justify-between p-6 rounded-[24px] border-2 transition-all ${r.id === currentUser?.id ? "bg-rose-50 border-rose-200 ring-1 ring-rose-100" : "bg-slate-50 border-slate-100"}`}>
                  <div className="flex items-center gap-5">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black ${i === 0 ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400"}`}>{i+1}</div>
                    <div>
                      <div className="font-black text-slate-900 text-lg">{r.name} {r.id === currentUser?.id && <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[9px] rounded-md uppercase">You</span>}</div>
                      <div className="text-xs font-bold text-slate-400">총 {r.count}건의 성과</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900">₩{r.total.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Commission</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsRankModalOpen(false)} className="w-full h-16 mt-10 bg-[#1e232d] text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl">실적 창 닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}