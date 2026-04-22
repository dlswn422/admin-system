"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Search,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  UserCheck,
  Upload,
  Filter,
  FileAudio,
  ExternalLink,
  Phone,
  User,
  Trash2,
  Clock,
  ListOrdered,
  MapPin
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
}

interface UserData {
  id: string;
  name: string;
  role_id?: string;
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

interface RecordingItem {
  id: string;
  customer_id: string;
  file_name: string;
  file_url: string;
  duration?: string | null;
  created_at?: string;
}

type FilterState = {
  date_from: string;
  date_to: string;
  search: string;
  tm_id: string;
  consult_status: string;
};

export default function ConsultationPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // --- States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [totalCount, setTotalCount] = useState(0); // 🌟 전체 데이터 개수 상태 추가
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    search: "",
    tm_id: "all",
    consult_status: "대기", // 초기값 대기
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 🌟 기본 10개

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const [recordingDeleteTarget, setRecordingDeleteTarget] = useState<RecordingItem | null>(null);
  const [isRecordingDeleteModalOpen, setIsRecordingDeleteModalOpen] = useState(false);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const recordingInputRef = useRef<HTMLInputElement | null>(null);

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesList = ["00", "10", "20", "30", "40", "50"];

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Data Fetching (서버 사이드 페이징 적용) ---
  const fetchData = useCallback(async (userOverride?: UserData) => {
    const activeUser = userOverride || currentUser;
    if (!activeUser) return;

    setIsLoading(true);
    try {
      const params: Record<string, string> = { 
        date_type: "상담일",
        limit: String(itemsPerPage),
        offset: String((currentPage - 1) * itemsPerPage) // 🌟 페이지에 따른 시작점 계산
      };
      
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      if (filters.consult_status && filters.consult_status !== "all") {
        params.consult_status = filters.consult_status;
      }

      const roleName = activeUser.role_name || (activeUser as any).role;
      // 🌟 [권한 로직 보존]
      if (roleName !== "관리자") {
        if (activeUser.id) params.tm_id = String(activeUser.id);
      } else {
        if (filters.tm_id && filters.tm_id !== "all") {
          params.tm_id = String(filters.tm_id);
        }
      }

      const queryParams = new URLSearchParams(params);
      const [cRes, uRes, codeRes] = await Promise.all([
        fetch(`/api/customers?${queryParams.toString()}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
      ]);

      const cData = await cRes.json();
      const uData = await uRes.json();
      const codeData = await codeRes.json();

      // 🌟 서버 응답 구조 대응
      const resultData = Array.isArray(cData) ? cData : (cData.data || []);
      setCustomers(resultData);
      setTotalCount(cData.totalCount || resultData.length);
      
      setUsers(Array.isArray(uData) ? uData : []);
      // 상담 상태에서 '전체' 제외
      setConsultCodes(Array.isArray(codeData) ? codeData.filter(c => c.code_name !== "전체") : []);
    } catch (e) {
      console.error("데이터 로드 에러:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser, currentPage, itemsPerPage]);

  // --- 초기 실행 ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        const roleName = parsedUser.role_name || parsedUser.role;
        if (roleName !== "관리자" && parsedUser.id) {
          setFilters(prev => ({ ...prev, tm_id: String(parsedUser.id) }));
        }
        fetchData(parsedUser); 
      } catch { window.location.href = "/login"; }
    } else { window.location.href = "/login"; }
  }, []);

  // 필터 및 페이지 변경 시 감지
  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, filters.date_from, filters.date_to, filters.search, filters.tm_id, filters.consult_status, currentPage, itemsPerPage]);

  const fetchRecordings = async (customerId: string) => {
    setIsRecordingsLoading(true);
    try {
      const res = await fetch(`/api/recordings/upload?customer_id=${customerId}`);
      const data = await res.json();
      setRecordings(Array.isArray(data) ? data : []);
    } catch { setRecordings([]); } finally { setIsRecordingsLoading(false); }
  };

  const confirmDeleteRecording = async () => {
    if (!recordingDeleteTarget) return;
    try {
      const res = await fetch(`/api/recordings/upload`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordingDeleteTarget.id })
      });
      if (res.ok) {
        showToast("삭제되었습니다.");
        setIsRecordingDeleteModalOpen(false);
        if (selectedCustomer) await fetchRecordings(selectedCustomer.id);
      }
    } catch { showToast("삭제 실패", "error"); }
  };

  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const baseDate = customer.consult_date ? customer.consult_date.replace("T", " ") : "";
    setFormData({ ...customer, consult_date: baseDate });
    setIsModalOpen(true);
    await fetchRecordings(customer.id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsModalOpen(false);
      showToast("정보가 저장되었습니다.");
      fetchData();
    }
  };

  const handleResetFilters = () => {
    if (!currentUser) return;
    const roleName = currentUser.role_name || (currentUser as any).role;
    setFilters({
      date_from: "",
      date_to: "",
      search: "",
      tm_id: roleName === "관리자" ? "all" : String(currentUser.id),
      consult_status: "대기",
    });
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => customers, [customers]); // 서버에서 잘려오므로 그대로 사용
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20 px-4 md:px-0 text-slate-900">
      <input ref={recordingInputRef} type="file" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file && selectedCustomer) {
          setIsUploading(true);
          const body = new FormData();
          body.append("file", file);
          body.append("customer_id", selectedCustomer.id);
          body.append("created_by", String(currentUser.id));
          const res = await fetch("/api/recordings/upload", { method: "POST", body });
          if (res.ok) { fetchRecordings(selectedCustomer.id); showToast("업로드 성공"); }
          setIsUploading(false);
        }
      }} />

      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] border border-white/10 px-5 py-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* Header Area */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,18,36,0.88))] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,transparent_72%,rgba(59,130,246,0.06))]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
                <Layers className="h-3.5 w-3.5" /> 상담 통합 관리
              </div>
              <h1 className="text-[2.4rem] font-black leading-[1.02] tracking-[-0.05em] text-white">상담 관리</h1>
              <p className="mt-4 text-[15px] leading-7 text-slate-300">
                {(currentUser.role_name || (currentUser as any).role) === "관리자" ? "모든 상담 현황을 실시간으로 모니터링합니다." : `${currentUser.name} 상담원님의 배정 리스트입니다.`}
              </p>
            </div>
            <button onClick={() => fetchData()} className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-xl backdrop-blur-xl transition-all hover:bg-white/[0.1]">
              <RotateCw className={`h-5 w-5 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Filter Area */}
      <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-14 items-center justify-center gap-3 rounded-[20px] bg-slate-100/70 px-4 text-sm font-black text-slate-600">
            <Filter className="h-4 w-4" /> 상담일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={(e) => setFilters(p => ({ ...p, date_from: e.target.value }))} className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner" />
            <div className="flex h-14 items-center justify-center font-black text-slate-400">~</div>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters(p => ({ ...p, date_to: e.target.value }))} className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="업체명, 고객명 검색" className="h-14 w-full rounded-[20px] border-2 border-slate-200 bg-white pl-12 pr-5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <select 
            disabled={(currentUser.role_name || (currentUser as any).role) !== "관리자"} 
            value={filters.tm_id} 
            onChange={(e) => setFilters(p => ({ ...p, tm_id: e.target.value }))} 
            className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 shadow-inner"
          >
            {(currentUser.role_name || (currentUser as any).role) === "관리자" ? (
              <>
                <option value="all">담당 상담원 전체</option>
                {users.filter(u => u.role_name === "TM").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </>
            ) : <option value={currentUser.id}>{currentUser.name}</option>}
          </select>

          <select value={filters.consult_status} onChange={(e) => setFilters(p => ({ ...p, consult_status: e.target.value }))} className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner">
            {consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
          </select>

          <button onClick={handleResetFilters} className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-8 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm">초기화</button>
          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-lg"><Sparkles className="h-4 w-4 text-blue-400" /> 검색 {totalCount}건</div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5 bg-white">
           <div className="flex items-center gap-2 text-slate-900">
             <ListOrdered className="h-5 w-5 text-slate-400" />
             <h2 className="text-lg font-black tracking-tight">상담 레지스트리</h2>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</span>
             <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="h-10 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 outline-none transition-all">
               <option value={10}>10개</option><option value={50}>50개</option><option value={100}>100개</option>
             </select>
           </div>
        </div>
        <div className="overflow-x-auto p-4 md:p-8">
          <div className="min-w-[1400px] space-y-3">
            <div className="grid grid-cols-[160px_180px_150px_150px_150px_minmax(300px,1fr)_120px] gap-6 px-8 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="text-center">상담일시</span><span>업체명</span><span className="text-center">대표자</span><span className="text-center">연락처</span><span className="text-center">담당자</span><span>상담 메모</span><span className="text-center">진행 상태</span>
            </div>
            {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-[28px] bg-slate-50" />) : 
             paginatedData.length > 0 ? paginatedData.map(c => {
              const hasDate = c.consult_date && c.consult_date.trim() !== "" && c.consult_date !== "null";
              const datePart = hasDate ? c.consult_date.split(" ")[0].replace(/-/g, ".") : "-";
              const timePart = hasDate ? c.consult_date.split(" ")[1]?.slice(0, 5) : "";

              return (
                <div key={c.id} onClick={() => openModal(c)} className="group grid grid-cols-[160px_180px_150px_150px_150px_minmax(300px,1fr)_120px] items-center gap-6 rounded-[28px] border border-slate-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl cursor-pointer">
                  <div className="text-center flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-900">{datePart}</span>
                    {timePart && <span className="text-[10px] font-bold text-blue-500">{timePart}</span>}
                  </div>
                  <div className="overflow-hidden">
                    <div className="truncate text-base font-black text-slate-900">{c.company_name}</div>
                    <div className="truncate text-[10px] text-slate-400 font-medium">{c.note || "비고 없음"}</div>
                  </div>
                  <div className="text-center text-sm font-semibold text-slate-700">{c.customer_name}</div>
                  <div className="text-center text-sm font-semibold text-slate-700">{c.mobile_phone}</div>
                  <div className="text-center text-sm font-bold text-blue-600">{(users.find(u => u.id === c.tm_id))?.name || "미배정"}</div>
                  <div className="line-clamp-1 text-sm text-slate-500">{c.consult_memo || "기록 없음"}</div>
                  <div className="flex justify-center"><span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black text-blue-600">{c.consult_status}</span></div>
                </div>
              );
             }) : <div className="py-20 text-center text-slate-300 font-bold italic">데이터가 없습니다.</div>}
          </div>
        </div>
        
        {/* Pagination Section */}
        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-10 py-8">
          <p className="text-sm font-bold text-slate-400">Total {totalCount} 건</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={()=>setCurrentPage(p=>p-1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex h-12 items-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      {/* --- 🌟 Detail Modal (콤팩트 최적화) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-slate-950/60 p-0 md:p-4 backdrop-blur-sm">
          <div className="relative flex h-[94vh] md:h-auto md:max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[40px] md:rounded-[40px] bg-white shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white"><UserCheck className="h-4 w-4" /></div>
                <h2 className="text-base font-black tracking-tight text-slate-900">상담 상세 설정</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide text-slate-900">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">업체명</label>
                  <input value={formData.company_name || ""} onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">대표자</label>
                  <input value={formData.customer_name || ""} onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tight">연락처</label>
                  <input value={formData.mobile_phone || ""} onChange={(e) => setFormData(p => ({ ...p, mobile_phone: e.target.value }))} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> 상세 주소</label>
                  <textarea value={formData.address || ""} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} className="h-16 w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all resize-none outline-none" placeholder="주소를 입력하세요." />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-800"><Clock className="h-4 w-4 text-blue-500" /> 상담 일시 및 상태</div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={formData.consult_status || ""} onChange={(e) => setFormData(p => ({ ...p, consult_status: e.target.value }))} className="h-10 rounded-xl border-2 border-blue-100 bg-blue-50/30 px-3 text-xs font-black text-blue-600 outline-none">
                    {consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
                  </select>
                  <input type="date" value={formData.consult_date ? formData.consult_date.split(" ")[0] : ""} onChange={(e) => {
                    const time = formData.consult_date?.split(" ")[1] || "09:00:00";
                    setFormData(p => ({ ...p, consult_date: `${e.target.value} ${time}` }));
                  }} className="h-10 rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-slate-900 outline-none" />
                </div>
                <div className="flex gap-2">
                  <select value={formData.consult_date?.split(" ")[1]?.split(":")[0] || "09"} onChange={(e) => {
                    const d = formData.consult_date?.split(" ")[0] || "";
                    const m = formData.consult_date?.split(" ")[1]?.split(":")[1] || "00";
                    setFormData(p => ({ ...p, consult_date: `${d} ${e.target.value}:${m}:00` }));
                  }} className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-900 text-center outline-none">
                    {hoursList.map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <select value={formData.consult_date?.split(" ")[1]?.split(":")[1] || "00"} onChange={(e) => {
                    const d = formData.consult_date?.split(" ")[0] || "";
                    const h = formData.consult_date?.split(" ")[1]?.split(":")[0] || "09";
                    setFormData(p => ({ ...p, consult_date: `${d} ${h}:${e.target.value}:00` }));
                  }} className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-900 text-center outline-none">
                    {minutesList.map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">상담 기록</label>
                <textarea value={formData.consult_memo || ""} onChange={(e) => setFormData(p => ({ ...p, consult_memo: e.target.value }))} className="h-20 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all resize-none outline-none" placeholder="내용을 기록하세요." />
              </div>

              <div className="rounded-2xl border-2 border-dashed border-emerald-100 bg-emerald-50/20 p-4 text-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1.5"><FileAudio className="h-4 w-4" /> 녹취 파일</span>
                  <button type="button" onClick={() => recordingInputRef.current?.click()} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-emerald-700 shadow-md transition-all">
                    <Upload className="h-3.5 w-3.5" /> 파일 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-[80px] overflow-y-auto pr-1">
                  {recordings.length === 0 ? <div className="text-center py-2 text-[10px] font-bold text-slate-300">첨부 파일 없음</div> : 
                   recordings.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                      <span className="text-[10px] font-bold text-slate-700 truncate flex-1 mr-2">{r.file_name}</span>
                      <div className="flex gap-1">
                        <a href={r.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><ExternalLink className="h-3.5 w-3.5" /></a>
                        <button type="button" onClick={() => {setRecordingDeleteTarget(r); setIsRecordingDeleteModalOpen(true);}} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1 pb-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 flex-1 rounded-2xl border-2 border-slate-200 font-black text-slate-400 text-xs hover:bg-slate-50 transition-all">닫기</button>
                <button type="submit" className="h-12 flex-[2] rounded-2xl bg-slate-900 font-black text-white text-xs shadow-xl hover:bg-slate-800 transition-all">변경 내용 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recording Delete Modal */}
      {isRecordingDeleteModalOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-6 text-slate-900">
          <div className="w-full max-w-[280px] rounded-[30px] bg-white p-6 text-center shadow-2xl border border-slate-100">
            <h3 className="text-sm font-black">파일을 삭제할까요?</h3>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={confirmDeleteRecording} className="h-11 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 transition-all">삭제</button>
              <button onClick={() => {setIsRecordingDeleteModalOpen(false); setRecordingDeleteTarget(null);}} className="h-11 rounded-xl font-bold text-slate-400 text-xs hover:bg-slate-100 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}