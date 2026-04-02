
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserPlus, Search, RotateCw, Trash2, Edit3, X, ChevronLeft, ChevronRight,
  Layers, Sparkles, AlertTriangle, Smartphone, FileSpreadsheet, Plus, 
  Phone, MapPin, Building, CalendarDays, ChevronRight as ChevronRightIcon,
  Wallet, Mic, Activity, Download, ListOrdered, UserCheck, CheckCircle2, UserCircle,
  Upload, FileAudio, Play
} from "lucide-react";

// --- Interfaces ---
interface Customer {
  id: string; customer_name: string; company_name: string; mobile_phone: string;
  landline_phone: string; address: string; note: string; receipt_date: string;
  tm_id: string; consult_date: string; consult_status: string; consult_memo: string;
  sales_id: string; sales_date: string; sales_status: string; sales_memo: string;
  sales_commission: number;
}

interface User { id: string; name: string; role_name: string; }
interface CommonCode { code_value: string; code_name: string; }
interface Toast { message: string; type: "success" | "error"; }

type FilterState = {
  date_type: string; date_from: string; date_to: string; search: string;
  tm_id: string; sales_id: string; consult_status: string; sales_status: string;
};

const INITIAL_FILTERS: FilterState = {
  date_type: "접수일", date_from: "", date_to: "", search: "",
  tm_id: "all", sales_id: "all", consult_status: "all", sales_status: "all",
};

export default function CustomersPage() {
  // --- States (800줄 원본 데이터 유지) ---
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

  // --- Handlers: UI & Feedback ---
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const formatDate = (val?: string) => val ? val.split('T')[0].replace(/-/g, '.') : "-";

  // --- API: Data Fetching (실시간 재조회 반영) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ 
        ...filters, 
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
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
    } catch (e) { showToast("데이터 로드 실패", "error"); }
    finally { setIsLoading(false); }
  }, [filters, itemsPerPage, currentPage, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Logic: Selection & Pagination ---
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) setSelectedIds([]);
    else setSelectedIds(paginatedData.map(c => c.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // --- Handlers: 일괄 배정 (체크박스 연동) ---
  const handleBulkAssign = async (type: 'TM' | 'SALES') => {
    const assigneeId = type === 'TM' ? assignTmId : assignSalesId;
    if (!assigneeId) return showToast("배정할 담당자를 선택해주세요.", "error");
    if (selectedIds.length === 0) return showToast("고객을 먼저 선택해주세요.", "error");

    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, type, assignee_id: assigneeId })
      });
      if (res.ok) {
        showToast(`${selectedIds.length}명 일괄 배정 완료`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (e) { showToast("배정 중 오류 발생", "error"); }
  };

  // --- Handlers: 엑셀 양식 다운로드 (이미지 양식 100% 재현) ---
  const downloadTemplate = () => {
    const row1 = "일괄 등록 주의 사항,,,,,";
    const row2 = "- 해당 파일의 형식을 임의 대로 수정하거나 필수값을 입력하지 않으시면 정상적으로 등록되지 않을 수 있습니다.,,,,,";
    const row3 = "- 공백이 포함된 행이 있는지 주의 부탁드립니다. 빈 값의 데이터 행이 등록될 수 있습니다.,,,,,";
    const row4 = "- 모든 항목의 셀 표시 형식(서식)이 \"텍스트\"로 설정된 것을 확인 후 파일을 업로드해 주세요.,,,,,";
    const header = "상담일자,업체명,대표자명,유선전화,핸드폰,주소,비고";
    const csvContent = "\ufeff" + [row1, row2, row3, row4, header].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "고객일괄등록_양식.csv";
    link.click();
  };

  // --- Handlers: CRUD ---
  const openModal = (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    setFormData(customer ? { ...customer } : { receipt_date: new Date().toISOString().split("T")[0] });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedCustomer ? `/api/customers/${selectedCustomer.id}` : "/api/customers";
    const res = await fetch(url, { method: selectedCustomer ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setIsModalOpen(false); showToast("저장되었습니다."); fetchData(); }
  };

  const getStatusTone = (v?: string) => {
    const text = (v || "").trim();
    if (/(완료|계약|성공|종결)/.test(text)) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (/(보류|취소|실패|부재)/.test(text)) return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="mx-auto max-w-[1800px] space-y-3 pb-20 p-3 md:p-8 font-sans antialiased text-slate-950">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-2xl border border-white/10 px-6 py-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-8 ${toast.type === "success" ? "bg-slate-900 text-white" : "bg-rose-600 text-white"}`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-black">{toast.message}</p>
        </div>
      )}

      {/* 1. 슬림 히어로 액션바 */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[24px] md:rounded-[35px] bg-[#0f172a] px-8 py-6 shadow-xl text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20"><Layers size={24} /></div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">고객 통합 관리</h1>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">CRM Intelligence System</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={downloadTemplate} className="h-10 px-4 bg-slate-800 text-slate-300 rounded-xl font-black text-xs hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"><Download size={16} /> 양식</button>
              <button className="h-10 px-4 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md"><FileSpreadsheet size={16} /> 업로드</button>
              <button onClick={() => openModal()} className="h-10 px-5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md"><Plus size={18} /> 신규 등록</button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 컴팩트 3단 통합 필터 (높이 줄임 + 선명도 강화) */}
      <section className="fade-up rounded-[24px] border border-slate-200 bg-white px-6 py-3 shadow-sm space-y-2">
        {/* 행 1: 실시간 검색 */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2 min-w-[60px] font-black text-slate-900 text-[11px] uppercase tracking-widest">조회</div>
          <div className="flex flex-col sm:flex-row flex-1 gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
              <select value={filters.date_type} onChange={e => setFilters({...filters, date_type: e.target.value})} className="bg-transparent text-xs font-black px-2 outline-none text-slate-900 cursor-pointer"><option>접수일</option><option>상담일</option></select>
              <input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-slate-950 w-[115px]" />
              <span className="text-slate-400 font-bold text-xs">~</span>
              <input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-slate-950 w-[115px]" />
            </div>
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="업체명, 대표자, 연락처 통합 검색 (실시간)" className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-black text-slate-950 outline-none focus:bg-white" />
            </div>
          </div>
        </div>

        {/* 행 2: 배정 */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 border-t border-slate-50 pt-2">
          <div className="flex items-center gap-2 min-w-[60px] font-black text-slate-900 text-[11px] uppercase tracking-widest">배정</div>
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <select value={assignTmId} onChange={e => setAssignTmId(e.target.value)} className="min-w-[130px] h-9 bg-white border-2 border-slate-200 rounded-xl px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-500"><option value="">TM 선택</option>{users.filter(u => u.role_name === "TM").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              <button onClick={() => handleBulkAssign('TM')} className="whitespace-nowrap h-9 px-3 bg-slate-900 text-white rounded-xl font-black text-[11px] hover:bg-blue-600 transition-all active:scale-95">TM 배정</button>
            </div>
            <div className="hidden sm:block w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <select value={assignSalesId} onChange={e => setAssignSalesId(e.target.value)} className="flex-1 sm:min-w-[130px] h-9 bg-white border-2 border-slate-200 rounded-xl px-2 text-xs font-black text-slate-900 outline-none focus:border-indigo-500"><option value="">영업사원 선택</option>{users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              <button onClick={() => handleBulkAssign('SALES')} className="whitespace-nowrap h-9 px-3 bg-slate-900 text-white rounded-xl font-black text-[11px] hover:bg-indigo-600 transition-all active:scale-95">영업 배정</button>
            </div>
            {selectedIds.length > 0 && <div className="ml-auto text-blue-700 font-black text-[11px] animate-pulse">{selectedIds.length}건 선택됨</div>}
          </div>
        </div>

        {/* 행 3: 필터 */}
        <div className="hidden md:flex items-center gap-6 border-t border-slate-50 pt-2">
          <div className="flex items-center gap-2 min-w-[60px] font-black text-slate-900 text-[11px] uppercase tracking-widest">필터</div>
          <div className="grid grid-cols-4 gap-3 flex-1">
            <select value={filters.tm_id} onChange={e => setFilters({...filters, tm_id: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 outline-none"><option value="all">담당 TM 전체</option>{users.filter(u => u.role_name === "TM").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
            <select value={filters.consult_status} onChange={e => setFilters({...filters, consult_status: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 outline-none"><option value="all">상담 상태</option>{consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}</select>
            <select value={filters.sales_id} onChange={e => setFilters({...filters, sales_id: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 outline-none"><option value="all">영업자 전체</option>{users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
            <select value={filters.sales_status} onChange={e => setFilters({...filters, sales_status: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 outline-none"><option value="all">영업 상태</option>{salesCodes.map(s => <option key={s.code_value} value={s.code_name}>{s.code_name}</option>)}</select>
          </div>
          <button onClick={() => setFilters(INITIAL_FILTERS)} className="text-[10px] font-black text-slate-400 hover:text-rose-600 underline underline-offset-4 px-2">초기화</button>
        </div>
      </section>

      {/* 3. 데이터 리스트 (PC: 13개 컬럼 / 모바일: 카드형) */}
      <section className="fade-up overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm flex flex-col">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs md:text-sm font-black text-slate-950 flex items-center gap-2"><ListOrdered size={16} className="text-blue-600"/> 데이터 현황 ({customers.length}건)</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="h-8 bg-white border-2 border-slate-200 rounded-lg px-2 text-xs font-black text-slate-950">
            <option value={10}>10개씩</option><option value={50}>50개씩</option><option value={100}>100개씩</option><option value={500}>500개씩</option>
          </select>
        </div>

        {/* PC 전용: 13개 컬럼 고정 순서 고선명 테이블 */}
        <div className="hidden md:block w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-[#1e293b] text-white">
              <tr>
                <th className="w-[3%] px-2 py-4 text-center border-r border-slate-700">
                  <input type="checkbox" checked={selectedIds.length === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-400 bg-transparent cursor-pointer" />
                </th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700">상담일자</th>
                <th className="w-[12%] px-3 py-4 text-[11px] font-black border-r border-slate-700">업체명</th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700">대표자명</th>
                <th className="w-[10%] px-2 py-4 text-[11px] font-black text-center border-r border-slate-700">핸드폰</th>
                <th className="w-[18%] px-3 py-4 text-[10px] font-black border-r border-slate-700">주소</th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700 text-center">접수일</th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700">담당TM</th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700 text-center">상담상태</th>
                <th className="w-[8%] px-2 py-4 text-[10px] font-black text-center border-r border-slate-700 text-center">영업담당</th>
                <th className="w-[9%] px-2 py-4 text-[11px] font-black text-right pr-4">정산금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan={11} className="py-10 bg-slate-50/5"></td></tr>) : paginatedData.map((c) => (
                <tr key={c.id} className={`group hover:bg-blue-50/40 transition-all cursor-pointer ${selectedIds.includes(c.id) ? 'bg-blue-50/80' : ''}`} onClick={() => openModal(c)}>
                  <td className="px-2 py-3 text-center border-r border-slate-50" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
                  </td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[11px] font-black text-slate-950">{formatDate(c.consult_date)}</td>
                  <td className="px-3 py-3 border-r border-slate-50 text-[13px] font-black text-slate-950 truncate group-hover:text-blue-700 transition-colors">{c.company_name}</td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[12px] font-black text-slate-900">{c.customer_name}</td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[12px] font-black text-slate-950 tabular-nums">{c.mobile_phone}</td>
                  <td className="px-3 py-3 border-r border-slate-50 text-[11px] font-black text-slate-800 truncate">{c.address || "-"}</td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[11px] font-black text-slate-900">{c.receipt_date}</td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[12px] font-black text-slate-900">{users.find(u => u.id === c.tm_id)?.name || "-"}</td>
                  <td className="px-2 py-3 text-center border-r border-slate-50"><span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black border shadow-sm ${getStatusTone(c.consult_status)}`}>{c.consult_status || "대기"}</span></td>
                  <td className="px-2 py-3 text-center border-r border-slate-50 text-[12px] font-black text-slate-900">{users.find(u => u.id === c.sales_id)?.name || "-"}</td>
                  <td className="px-2 py-3 text-right font-black text-blue-700 text-[14px] pr-4 tabular-nums">₩{(c.sales_commission || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 최적화: 카드형 레이아웃 */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedData.map((c) => (
            <div key={c.id} onClick={() => openModal(c)} className="p-4 active:bg-slate-50 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }} className="w-5 h-5 rounded border-slate-300" />
                  <p className="font-black text-slate-950 text-base">{c.company_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[9px] font-black border ${getStatusTone(c.consult_status)}`}>{c.consult_status || "대기"}</span>
              </div>
              <div className="flex justify-between text-[12px] font-black">
                <span className="text-slate-600">{c.customer_name} 대표</span>
                <span className="text-blue-700">{c.mobile_phone}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate bg-slate-50 p-2 rounded-lg">{c.address || "주소 미등록"}</p>
            </div>
          ))}
        </div>
        
        {/* 하단 페이지네이션 */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-center bg-white shadow-inner">
          <div className="flex items-center gap-3">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-2 px-6"><span className="text-lg font-black text-slate-950 tracking-tighter">{currentPage}</span><span className="text-slate-300 font-bold">/</span><span className="text-sm font-bold text-slate-400">{totalPages}</span></div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20"><ChevronRight size={20} /></button>
          </div>
        </div>
      </section>

      {/* 4. 이미지 기반 3단 상세 모달 (반응형 최적화) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/65 p-4 md:p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-[30px] md:rounded-[45px] border border-white/10 bg-white shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="p-6 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-[linear-gradient(to_bottom,white,#F8FAFC)]">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 md:right-10 md:top-10 h-10 w-10 md:h-14 md:w-14 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-all z-10"><X size={24} /></button>
              
              <div className="mb-8 md:mb-12 border-b border-slate-100 pb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black text-blue-600 uppercase tracking-widest"><UserCheck size={16} /> Data Synchronization</div>
                <h2 className="mt-4 text-[2.2rem] md:text-[3.5rem] font-black tracking-tighter text-slate-950 leading-none">{selectedCustomer ? "고객 인텔리전스 수정" : "신규 파이프라인 생성"}</h2>
                <p className="mt-4 text-slate-500 text-sm md:text-lg font-medium">업체, 상담, 영업의 전 과정을 통합 관리합니다.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-8 md:space-y-12">
                <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
                  {/* 섹션 1: 업체정보 */}
                  <div className="space-y-6 bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><div className="h-6 w-1.5 rounded-full bg-blue-600" /> 업체정보</h3>
                    <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">업체명</label>
                      <input required value={formData.company_name || ""} onChange={e => setFormData({...formData, company_name: e.target.value})} className="h-12 w-full rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black text-slate-950 focus:bg-white outline-none text-sm" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">대표자명</label>
                      <input value={formData.customer_name || ""} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="h-12 w-full rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black focus:bg-white outline-none text-sm" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">핸드폰</label>
                      <input required value={formData.mobile_phone || ""} onChange={e => setFormData({...formData, mobile_phone: e.target.value})} className="h-12 w-full rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black text-blue-700 outline-none text-sm" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">주소</label>
                      <textarea value={formData.address || ""} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-[18px] border-2 border-slate-100 bg-white p-5 font-black text-slate-900 outline-none focus:border-blue-500 h-24 resize-none text-xs" /></div>
                    </div>
                  </div>

                  {/* 섹션 2: 상담정보 */}
                  <div className="space-y-6 bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><div className="h-6 w-1.5 rounded-full bg-emerald-500" /> 상담정보</h3>
                    <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">담당 TM</label>
                      <select value={formData.tm_id || ""} onChange={e => setFormData({...formData, tm_id: e.target.value})} className="w-full h-14 rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black text-slate-950 outline-none"><option value="">미배정</option>{users.filter(u => u.role_name === "TM").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">상담 진행 단계</label>
                      <select value={formData.consult_status || ""} onChange={e => setFormData({...formData, consult_status: e.target.value})} className="w-full h-14 rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black text-slate-950 outline-none">{consultCodes.map(c => <option key={c.code_value} value={c.code_name}>{c.code_name}</option>)}</select></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">상담 메모</label>
                      <textarea value={formData.consult_memo || ""} onChange={e => setFormData({...formData, consult_memo: e.target.value})} className="w-full rounded-[18px] border-2 border-slate-100 bg-white p-5 font-black text-slate-950 outline-none focus:border-emerald-500 h-48 resize-none text-xs" placeholder="상담 이력을 입력하세요..." /></div>
                    </div>
                  </div>

                  {/* 섹션 3: 영업정보 */}
                  <div className="space-y-6 bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><div className="h-6 w-1.5 rounded-full bg-indigo-500" /> 영업정보</h3>
                    <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">담당 영업사원</label>
                      <select value={formData.sales_id || ""} onChange={e => setFormData({...formData, sales_id: e.target.value})} className="w-full h-14 rounded-[18px] border-2 border-slate-100 bg-slate-50 px-5 font-black text-slate-950 outline-none"><option value="">미배정</option>{users.filter(u => u.role_name === "영업").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">정산 수수료 (₩)</label>
                      <div className="relative"><Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={18}/><input type="number" value={formData.sales_commission || 0} onChange={e => setFormData({...formData, sales_commission: Number(e.target.value)})} className="w-full h-14 rounded-[18px] border-2 border-slate-100 bg-slate-50 pl-14 pr-6 font-black text-blue-700 text-lg shadow-sm outline-none" /></div></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">비고</label>
                      <textarea value={formData.note || ""} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full rounded-[18px] border-2 border-slate-100 bg-white p-5 font-black text-slate-950 outline-none h-32 resize-none text-xs" /></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 px-10 py-5 rounded-[20px] font-black text-slate-400 hover:bg-slate-100 transition-all text-xs tracking-widest uppercase">Cancel</button>
                  <button type="submit" className="order-1 sm:order-2 px-24 py-5 bg-slate-950 text-white rounded-[20px] font-black text-base shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest">Update Data</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 스타일 애니메이션 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 10px; }
        .h-13 { height: 3.25rem; }
        .h-15 { height: 3.75rem; }
        @keyframes soft-scale-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .soft-scale-in { animation: soft-scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}