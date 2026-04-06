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
  Mic,
  UserCheck,
  Upload,
  Filter,
  Users,
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
  // --- 사용자 권한 설정 (관리자 테스트 시 role_name: "관리자", TM 테스트 시 "TM") ---
  const [currentUser] = useState({ id: "user_1", name: "문창우", role_name: "관리자" }); 
  const isAdmin = currentUser.role_name === "관리자";

  const INITIAL_FILTERS: FilterState = {
    date_from: "",
    date_to: "",
    search: "",
    tm_id: isAdmin ? "all" : currentUser.id,
    consult_status: "all",
  };

  // --- States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
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

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const recordingInputRef = useRef<HTMLInputElement | null>(null);

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

  // --- API Calls ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        date_type: "상담일",
        ...( !isAdmin && { tm_id: currentUser.id } ) 
      }).toString();

      const [cRes, uRes, codeRes] = await Promise.all([
        fetch(`/api/customers?${queryParams}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
      ]);

      const cData = await cRes.json();
      setCustomers(Array.isArray(cData) ? cData : cData?.data || []);
      setUsers(await uRes.json());
      setConsultCodes(await codeRes.json());
    } catch {
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAdmin, currentUser.id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // --- Handlers ---
  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
    await fetchRecordings(customer.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer) return;

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("customer_id", selectedCustomer.id);
      const res = await fetch("/api/recordings/upload", { method: "POST", body });
      if (res.ok) {
        showToast("파일이 업로드되었습니다.");
        await fetchRecordings(selectedCustomer.id);
      }
    } catch {
      showToast("업로드 실패", "error");
    } finally {
      setIsUploading(false);
      if (recordingInputRef.current) recordingInputRef.current.value = "";
    }
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
      showToast("정보가 저장되었습니다.");
      fetchData();
    }
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      showToast("삭제되었습니다.");
      fetchData();
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      <input ref={recordingInputRef} type="file" className="hidden" onChange={handleFileUpload} />

      {/* 알림 토스트 */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] px-5 py-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* 1. 상단 블랙 헤더 */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,18,36,0.88))] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,transparent_72%,rgba(59,130,246,0.06))]" />
          
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
                <Layers className="h-3.5 w-3.5" />
                상담 통합 관리
              </div>
              <h1 className="text-[2.4rem] font-black leading-[1.02] tracking-[-0.05em] text-white">상담 관리</h1>
              <p className="mt-4 text-[15px] leading-7 text-slate-300">
                {isAdmin ? "모든 상담 현황을 실시간으로 모니터링합니다." : `${currentUser.name} 상담원님에게 배정된 상담 리스트입니다.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-xl backdrop-blur-xl transition-all hover:bg-white/[0.1]"
              >
                <RotateCw className={`h-5 w-5 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 필터 섹션 */}
      <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="grid items-start gap-4 xl:grid-cols-[140px_1fr]">
          <div className="flex h-14 items-center justify-center gap-3 rounded-[20px] bg-slate-100/70 px-4 text-sm font-black text-slate-600">
            <Filter className="h-4 w-4" /> 상담일자
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[160px_30px_160px_1fr]">
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
            <div className="flex h-14 items-center justify-center text-slate-400 font-black">~</div>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="업체명, 고객명 검색" className="h-14 w-full rounded-[20px] border border-slate-200 bg-white pl-12 pr-5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <select
            disabled={!isAdmin}
            value={filters.tm_id}
            onChange={(e) => setFilters({ ...filters, tm_id: e.target.value })}
            className="app-select app-select-lg w-full"
          >
            <option value="all">담당 상담원 전체</option>
            {users.filter(u => u.role_name === "TM").map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={filters.consult_status}
            onChange={(e) => setFilters({ ...filters, consult_status: e.target.value })}
            className="app-select app-select-lg w-full"
          >
            {consultCodes.map(c => (
              <option key={c.code_value} value={c.code_name}>{c.code_name}</option>
            ))}
          </select>
          <button onClick={() => setFilters(INITIAL_FILTERS)} className="h-14 rounded-[20px] border border-slate-200 bg-white px-8 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">초기화</button>
          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-lg shadow-slate-900/10">
            <Sparkles className="h-4 w-4 text-blue-400" /> 검색 {customers.length}건
          </div>
        </div>
      </section>

      {/* 3. 리스트 영역 (상담 메모 포함 & 넓게 조정) */}
      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">상담 데이터 레지스트리</h2>
        </div>

        <div className="p-4 md:p-8 overflow-x-auto">
          <div className="min-w-[1400px] space-y-3">
            {/* 컬럼 비율 조정: 메모 영역 확보를 위해 비율 변경 */}
            <div className="grid grid-cols-[120px_180px_150px_150px_150px_minmax(300px,1fr)_120px_80px] gap-6 px-8 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span className="text-center">상담일자</span>
              <span>업체명</span>
              <span className="text-center">대표자</span>
              <span className="text-center">연락처</span>
              <span className="text-center">담당자</span>
              <span>상담 메모</span>
              <span className="text-center">진행 상태</span>
              <span className="text-center">관리</span>
            </div>

            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 animate-pulse rounded-[28px] bg-slate-50" />)
            ) : paginatedData.map((c) => (
              <div key={c.id} className="group grid grid-cols-[120px_180px_150px_150px_150px_minmax(300px,1fr)_120px_80px] items-center gap-6 rounded-[28px] border border-slate-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                <div className="text-center text-sm font-bold text-slate-500">{formatDate(c.consult_date)}</div>
                <div className="cursor-pointer" onClick={() => openModal(c)}>
                  <div className="text-base font-black text-slate-900 truncate">{c.company_name}</div>
                  <div className="mt-1 text-xs text-slate-400 font-medium truncate">{c.note || "비고 없음"}</div>
                </div>
                <div className="text-center text-sm font-semibold text-slate-700">{c.customer_name}</div>
                <div className="text-center text-sm font-semibold text-slate-700">{c.mobile_phone}</div>
                <div className="text-center text-sm font-bold text-blue-600">{getUserNameById(c.tm_id)}</div>
                
                {/* 상담 메모 영역: 넓게 표시 및 줄바꿈 방지(최대 2줄) */}
                <div className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed whitespace-pre-wrap">
                  {c.consult_memo || <span className="text-slate-300 italic">기록된 메모가 없습니다.</span>}
                </div>

                <div className="flex justify-center">
                  <span className={`px-4 py-2 rounded-full border text-[11px] font-black ${getStatusTone(c.consult_status)}`}>
                    {c.consult_status || "상담 대기"}
                  </span>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => { setDeleteTarget(c); setIsDeleteModalOpen(true); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">전체 {customers.length}건 중 {paginatedData.length}건 표시</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-2xl border hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronLeft className="h-5 w-5"/></button>
            <div className="px-6 py-3 rounded-2xl bg-slate-900 text-sm font-black text-white">{currentPage} / {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-2xl border hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronRight className="h-5 w-5"/></button>
          </div>
        </div>
      </section>

      {/* 4. 상세 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-xl scale-in">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[40px] bg-white shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-10 md:p-14">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    <UserCheck className="h-3.5 w-3.5" /> 상담 기록 상세
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">상담 데이터 상세 내역</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <section className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">업체명</label>
                    <input readOnly value={formData.company_name || ""} className="h-16 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">상담 상태</label>
                    <select
                      value={formData.consult_status || ""}
                      onChange={(e) => setFormData({ ...formData, consult_status: e.target.value })}
                      className="app-select app-select-lg w-full"
                    >
                      <option value="">상태 선택</option>
                      {consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">상담일자</label>
                    <input 
                      type="date" 
                      value={formData.consult_date || ""} 
                      onChange={e => setFormData({...formData, consult_date: e.target.value})} 
                      className="h-16 w-full rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20 transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">담당 상담원</label>
                    <input readOnly value={getUserNameById(formData.tm_id)} className="h-16 w-full rounded-2xl border bg-slate-50 px-6 font-bold text-slate-900 outline-none" />
                  </div>
                </section>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">상담 메모</label>
                  <textarea 
                    value={formData.consult_memo || ""} 
                    onChange={e => setFormData({...formData, consult_memo: e.target.value})} 
                    className="min-h-[200px] w-full rounded-[30px] border border-slate-200 bg-white p-8 font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20 transition-all leading-relaxed" 
                    placeholder="상담 내용을 상세히 기록하세요." 
                  />
                </div>

                {/* 상담 파일 관리 섹션 */}
                <section className="rounded-[35px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">상담 파일 관리</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">상담 녹취 또는 관련 파일을 업로드하고 관리할 수 있습니다.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => recordingInputRef.current?.click()} 
                      disabled={isUploading} 
                      className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black shadow-sm hover:shadow-md transition-all text-slate-700"
                    >
                      <Upload className="h-4 w-4" /> {isUploading ? "업로드 중..." : "파일 추가"}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {isRecordingsLoading ? <div className="h-16 animate-pulse rounded-2xl bg-white" /> : 
                     recordings.length === 0 ? <div className="py-12 text-center text-[10px] font-black text-slate-300 tracking-widest uppercase">등록된 파일이 없습니다</div> :
                     recordings.map(r => (
                        <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileAudio className="h-5 w-5"/></div>
                            <span className="text-sm font-black text-slate-700 truncate max-w-[300px]">{r.file_name}</span>
                          </div>
                          <div className="flex gap-2">
                            <a href={r.file_url} target="_blank" rel="noreferrer" className="flex h-10 px-4 items-center gap-2 rounded-xl border text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"><ExternalLink className="h-3.5 w-3.5"/> 열기</a>
                          </div>
                        </div>
                     ))
                    }
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

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[45px] bg-white p-12 text-center shadow-2xl">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[30px] bg-rose-50 text-rose-500"><AlertTriangle className="h-10 w-10" /></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">상담 삭제</h3>
            <p className="mt-4 text-sm font-bold text-slate-400 leading-relaxed">이 상담 기록을 영구적으로 삭제하시겠습니까?</p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={confirmDelete} className="h-14 rounded-2xl bg-rose-600 font-black text-white hover:bg-rose-700 transition-all">삭제 확인</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}