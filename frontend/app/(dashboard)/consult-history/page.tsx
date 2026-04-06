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
  Trash2
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
  id: string; // 데이터베이스의 유저 고유 ID (PK)
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
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    search: "",
    tm_id: "",
    consult_status: "all",
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // --- [수정] Data Fetching: role_id가 아닌 user.id를 엄격하게 사용 ---
  const fetchData = useCallback(async (userOverride?: UserData) => {
    const activeUser = userOverride || currentUser;
    if (!activeUser) return;

    setIsLoading(true);
    try {
      const params: Record<string, string> = { date_type: "상담일" };
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      if (filters.consult_status && filters.consult_status !== "all") {
        params.consult_status = filters.consult_status;
      }

      // [핵심 수정] role_id가 아닌 유저 고유 PK(id)를 사용하도록 강제
      // activeUser.id가 최우선이며, 없을 경우에만 fallback을 고려하지만 가급적 id가 있어야 함
      const userId = activeUser.id; 
      const roleName = activeUser.role_name || (activeUser as any).role;

      if (roleName !== "관리자") {
        // 상담사는 본인의 고유 ID(id)가 파라미터에 담겨야 함
        if (userId) {
          params.tm_id = String(userId);
        } else {
          console.error("유저 고유 ID(id)를 찾을 수 없습니다.");
        }
      } else {
        // 관리자인 경우 필터에서 선택된 ID 사용
        if (filters.tm_id) params.tm_id = String(filters.tm_id);
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        // undefined나 null이 문자열로 들어가는 것을 방지
        if (value && value !== "undefined" && value !== "null") {
          queryParams.append(key, value);
        }
      });

      const [cRes, uRes, codeRes] = await Promise.all([
        fetch(`/api/customers?${queryParams.toString()}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
      ]);

      const cData = await cRes.json();
      const uData = await uRes.json();
      const codeData = await codeRes.json();

      setCustomers(Array.isArray(cData) ? cData : cData?.data || []);
      setUsers(Array.isArray(uData) ? uData : []);
      setConsultCodes(Array.isArray(codeData) ? codeData : []);
    } catch (e) {
      console.error("데이터 로드 에러:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser]);

  // --- 초기 실행 ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // 만약 로그인 시 'id'가 아닌 다른 키로 저장되었다면 여기서 'id'로 매핑
        // 예: parsedUser.userId 등으로 저장되어 있다면 parsedUser.id = parsedUser.userId;
        
        setCurrentUser(parsedUser);
        
        const roleName = parsedUser.role_name || parsedUser.role;
        const userId = parsedUser.id;

        if (roleName !== "관리자" && userId) {
          setFilters(prev => ({ ...prev, tm_id: String(userId) }));
        }

        fetchData(parsedUser); 
      } catch (e) {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [filters.date_from, filters.date_to, filters.search, filters.tm_id, filters.consult_status]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer || !currentUser) return;

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("customer_id", selectedCustomer.id);
      body.append("created_by", String(currentUser.id));
      
      const res = await fetch("/api/recordings/upload", { method: "POST", body });
      if (res.ok) {
        showToast("파일이 업로드되었습니다.");
        await fetchRecordings(selectedCustomer.id);
      } else {
        showToast("업로드 실패", "error");
      }
    } catch {
      showToast("업로드 실패", "error");
    } finally {
      setIsUploading(false);
      if (recordingInputRef.current) recordingInputRef.current.value = "";
    }
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
        showToast("녹취 파일이 삭제되었습니다.");
        setIsRecordingDeleteModalOpen(false);
        setRecordingDeleteTarget(null);
        if (selectedCustomer) await fetchRecordings(selectedCustomer.id);
      } else {
        showToast("삭제 실패", "error");
      }
    } catch {
      showToast("삭제 실패", "error");
    }
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
    } else {
      showToast("저장 실패", "error");
    }
  };

  const handleResetFilters = () => {
    if (!currentUser) return;
    const roleName = currentUser.role_name || (currentUser as any).role;
    setFilters({
      date_from: "",
      date_to: "",
      search: "",
      tm_id: roleName === "관리자" ? "" : String(currentUser.id),
      consult_status: "all",
    });
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      <input ref={recordingInputRef} type="file" className="hidden" onChange={handleFileUpload} />

      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] px-5 py-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* Header */}
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

      {/* Filters */}
      <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-14 items-center justify-center gap-3 rounded-[20px] bg-slate-100/70 px-4 text-sm font-black text-slate-600">
            <Filter className="h-4 w-4" /> 상담일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={(e) => setFilters(p => ({ ...p, date_from: e.target.value }))} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
            <div className="flex h-14 items-center justify-center font-black text-slate-400">~</div>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters(p => ({ ...p, date_to: e.target.value }))} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="업체명, 고객명 검색" className="h-14 w-full rounded-[20px] border border-slate-200 bg-white pl-12 pr-5 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <select disabled={(currentUser.role_name || (currentUser as any).role) !== "관리자"} value={filters.tm_id || "all"} onChange={(e) => setFilters(p => ({ ...p, tm_id: e.target.value === "all" ? "" : e.target.value }))} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50">
            {(currentUser.role_name || (currentUser as any).role) === "관리자" ? (
              <>
                <option value="all">담당 상담원 전체</option>
                {users.filter(u => u.role_name === "TM").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </>
            ) : <option value={currentUser.id}>{currentUser.name}</option>}
          </select>

          <select value={filters.consult_status} onChange={(e) => setFilters(p => ({ ...p, consult_status: e.target.value }))} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
            <option value="all">상담 상태 전체</option>
            {consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
          </select>

          <button onClick={handleResetFilters} className="h-14 rounded-[20px] border border-slate-200 bg-white px-8 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">초기화</button>
          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-lg"><Sparkles className="h-4 w-4 text-blue-400" /> 검색 {customers.length}건</div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto p-4 md:p-8">
          <div className="min-w-[1400px] space-y-3">
            <div className="grid grid-cols-[120px_180px_150px_150px_150px_minmax(300px,1fr)_120px] gap-6 px-8 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="text-center">상담일자</span><span>업체명</span><span className="text-center">대표자</span><span className="text-center">연락처</span><span className="text-center">담당자</span><span>상담 메모</span><span className="text-center">진행 상태</span>
            </div>
            {isLoading ? [1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-[28px] bg-slate-50" />) : 
             paginatedData.length > 0 ? paginatedData.map(c => (
              <div key={c.id} className="group grid grid-cols-[120px_180px_150px_150px_150px_minmax(300px,1fr)_120px] items-center gap-6 rounded-[28px] border border-slate-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl">
                <div className="text-center text-sm font-bold text-slate-500">{c.consult_date?.split("T")[0] || "-"}</div>
                <div className="cursor-pointer" onClick={() => openModal(c)}>
                  <div className="truncate text-base font-black text-slate-900">{c.company_name}</div>
                  <div className="mt-1 truncate text-xs font-medium text-slate-400">{c.note || "비고 없음"}</div>
                </div>
                <div className="text-center text-sm font-semibold text-slate-700">{c.customer_name}</div>
                <div className="text-center text-sm font-semibold text-slate-700">{c.mobile_phone}</div>
                <div className="text-center text-sm font-bold text-blue-600">{(users.find(u => u.id === c.tm_id))?.name || "미배정"}</div>
                <div className="line-clamp-2 text-sm font-medium text-slate-600">{c.consult_memo || "기록 없음"}</div>
                <div className="flex justify-center"><span className="rounded-full border px-4 py-2 text-[11px] font-black bg-blue-50 text-blue-600">{c.consult_status || "대기"}</span></div>
              </div>
            )) : <div className="p-20 text-center font-bold text-slate-400">데이터가 없습니다.</div>}
          </div>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-50 px-10 py-8">
          <p className="text-sm font-bold text-slate-400">전체 {customers.length}건 중 {paginatedData.length}건 표시</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl border p-3 disabled:opacity-20 transition-all hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>
            <div className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl border p-3 disabled:opacity-20 transition-all hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="overflow-y-auto p-10 md:p-14">
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-black uppercase text-slate-500"><UserCheck className="h-3.5 w-3.5" /> 상세 정보</div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">상담 데이터 상세</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-10">
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-black"><div className="h-4 w-1 bg-blue-500 rounded-full" /> 업체 기본 정보</div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-400">업체명</label><input readOnly value={formData.company_name || ""} className="h-14 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-500 cursor-not-allowed" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-400">대표자명</label><input readOnly value={formData.customer_name || ""} className="h-14 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-500 cursor-not-allowed" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-400">핸드폰 번호</label><input readOnly value={formData.mobile_phone || ""} className="h-14 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-500 cursor-not-allowed" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-400">유선 번호</label><input readOnly value={formData.landline_phone || ""} className="h-14 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-500 cursor-not-allowed" /></div>
                    <div className="md:col-span-2 space-y-2"><label className="text-[11px] font-black text-slate-400">주소</label><input readOnly value={formData.address || ""} className="h-14 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-500 cursor-not-allowed" /></div>
                  </div>
                </section>
                <hr className="border-slate-100" />
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-black"><div className="h-4 w-1 bg-emerald-500 rounded-full" /> 상담 관리 영역</div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400">상담 상태</label>
                      <select value={formData.consult_status || ""} onChange={(e) => setFormData(p => ({ ...p, consult_status: e.target.value }))} className="h-16 w-full rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20 transition-all">
                        <option value="">상태 선택</option>
                        {consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400">상담일자</label>
                      <input type="date" value={formData.consult_date || ""} onChange={(e) => setFormData(p => ({ ...p, consult_date: e.target.value }))} className="h-16 w-full rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400">상담 메모</label>
                    <textarea value={formData.consult_memo || ""} onChange={(e) => setFormData(p => ({ ...p, consult_memo: e.target.value }))} className="min-h-[180px] w-full rounded-[30px] border border-slate-200 bg-white p-8 font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20" placeholder="상담 내용을 입력하세요." />
                  </div>
                </section>
                <section className="rounded-[35px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><FileAudio className="h-4 w-4" /> 상담 파일</h3>
                    <button type="button" onClick={() => recordingInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm hover:shadow-md transition-all">
                      <Upload className="h-4 w-4" /> {isUploading ? "업로드 중..." : "파일 추가"}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {recordings.length === 0 ? <div className="py-8 text-center text-[10px] font-black text-slate-300">등록된 파일 없음</div> : 
                     recordings.map(r => (
                      <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-4"><div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileAudio className="h-5 w-5" /></div><span className="max-w-[250px] truncate text-sm font-bold text-slate-700">{r.file_name}</span></div>
                        <div className="flex gap-2">
                          <a href={r.file_url} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all"><ExternalLink className="h-3.5 w-3.5" /> 열기</a>
                          <button type="button" onClick={() => {setRecordingDeleteTarget(r); setIsRecordingDeleteModalOpen(true);}} className="h-10 w-10 flex items-center justify-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-16 flex-1 rounded-2xl border border-slate-200 font-black text-slate-400 hover:bg-slate-50 transition-all">닫기</button>
                  <button type="submit" className="h-16 flex-[2] rounded-2xl bg-slate-900 font-black text-white shadow-xl hover:bg-slate-800 transition-all">변경 내용 저장</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Recording Delete Modal */}
      {isRecordingDeleteModalOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[45px] bg-white p-10 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mx-auto mb-6 h-20 w-20 flex items-center justify-center rounded-[30px] bg-rose-50 text-rose-500"><FileAudio className="h-10 w-10" /></div>
            <h3 className="text-2xl font-black text-slate-900">녹취 파일 삭제</h3>
            <p className="mt-3 text-sm font-bold text-slate-400 leading-relaxed">이 파일을 삭제하시겠습니까?<br/>{recordingDeleteTarget?.file_name}</p>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={confirmDeleteRecording} className="h-14 rounded-2xl bg-rose-600 font-black text-white hover:bg-rose-700 transition-all">삭제 확인</button>
              <button onClick={() => setIsRecordingDeleteModalOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}