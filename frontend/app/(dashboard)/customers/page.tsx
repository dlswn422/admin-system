"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  UserPlus, Search, RotateCw, UserCircle, Phone, 
  ChevronDown, Filter, Trash2, Edit3, Check, Building,
  CalendarDays, MapPin, NotebookTabs, X, 
  ChevronLeft, ChevronRight, FileAudio, Smartphone, Download,
  Wallet, Mic, Activity, Headphones
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    date_type: "접수일",
    search: "",
    tm_id: "all",
    consult_status: "all",
    sales_status: "all"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const [cRes, uRes] = await Promise.all([
        fetch(`/api/customers?${query}`),
        fetch("/api/users")
      ]);
      const cData = await cRes.json();
      const uData = await uRes.json();
      setCustomers(Array.isArray(cData) ? cData : []);
      setUsers(uData || []);
    } catch (e) {
      console.error("Fetch error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters.tm_id, filters.consult_status, filters.sales_status]);

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const paginatedData = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openModal = (customer: Customer | null = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({ ...customer });
    } else {
      setSelectedCustomer(null);
      setFormData({ 
        receipt_date: new Date().toISOString().split('T')[0],
        consult_status: "대기",
        sales_status: "방문 전",
        sales_commission: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedCustomer;
    const url = isEdit ? `/api/customers/${selectedCustomer.id}` : "/api/customers";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setIsModalOpen(false); fetchData(); }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10 px-6 animate-in fade-in duration-700">
      
      {/* --- 헤더 섹션 (User Master 톤 일치) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-widest">
            CRM Cloud Operations
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight italic font-serif leading-none">고객 통합 관리</h1>
          <p className="text-slate-400 font-medium text-sm">상담 내역, 녹취 및 영업 정산 데이터를 포함한 통합 마스터입니다.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="h-16 w-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center">
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-3 rounded-3xl bg-slate-900 px-10 py-5 text-sm font-black text-white hover:bg-blue-600 shadow-2xl transition-all">
            <UserPlus className="w-5 h-5" /> <span>신규 고객 추가</span>
          </button>
        </div>
      </div>

      {/* --- 통합 조회 조건 (As-is 기반) --- */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-2">
            <select value={filters.date_type} onChange={e => setFilters({...filters, date_type: e.target.value})} className="w-full h-14 rounded-2xl border-2 border-slate-100 px-4 text-sm font-bold outline-none">
              <option>접수일</option><option>상담일자</option><option>영업일자</option>
            </select>
          </div>
          <div className="lg:col-span-4 flex items-center gap-2">
            <input type="date" className="flex-1 h-14 rounded-2xl border-2 border-slate-100 px-4 text-sm font-bold" />
            <span className="text-slate-300">~</span>
            <input type="date" className="flex-1 h-14 rounded-2xl border-2 border-slate-100 px-4 text-sm font-bold" />
          </div>
          <div className="lg:col-span-4 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input placeholder="업체명, 성함, 연락처 통합 검색..." className="w-full h-14 pl-14 pr-6 rounded-2xl border-2 border-slate-100 text-sm font-bold focus:ring-4 ring-blue-500/5 transition-all" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          <button onClick={fetchData} className="lg:col-span-2 h-14 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-slate-900 transition-all shadow-lg">데이터 필터링</button>
        </div>
      </div>

      {/* --- 데이터 목록 테이블 --- */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-8">고객정보</th>
                <th className="px-8 py-8 text-center">상담관리</th>
                <th className="px-8 py-8 text-center">영업현황</th>
                <th className="px-10 py-8 text-right">제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-900">
              {paginatedData.map((c) => (
                <tr key={c.id} className="group hover:bg-blue-50/30 transition-colors cursor-pointer font-bold" onClick={() => openModal(c)}>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-xl italic font-serif">{c.customer_name?.[0]}</div>
                      <div>
                        <div className="text-lg tracking-tight font-black">{c.company_name || "개인고객"}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 uppercase"><UserCircle className="w-3 h-3"/> {c.customer_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <div className="text-sm">{users.find(u => u.id === c.tm_id)?.name || "미배정"}</div>
                    <div className={`mt-1.5 inline-flex px-3 py-1 rounded-full text-[9px] uppercase ${c.consult_status === '방문약속' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{c.consult_status}</div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <div className="text-sm text-blue-600">{c.sales_status}</div>
                    <div className="text-[10px] text-slate-400 font-mono">₩{c.sales_commission?.toLocaleString()}</div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button className="p-3 rounded-xl hover:bg-slate-900 hover:text-white text-slate-300 shadow-sm"><Edit3 className="w-4.5 h-4.5" /></button>
                      <button className="p-3 rounded-xl hover:bg-rose-600 hover:text-white text-slate-300 shadow-sm"><Trash2 className="w-4.5 h-4.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* --- 페이지네이션 --- */}
        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-serif">Viewing Page {currentPage} / {totalPages || 1}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20"><ChevronLeft className="w-4 h-4"/></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* --- ✨ 01-03 단계 섹션 모달 (As-is 필드 무생략 구현) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/20 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-white rounded-[4rem] p-16 shadow-2xl border border-white animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic font-serif uppercase">Customer Information Node</h2>
               <button onClick={() => setIsModalOpen(false)} className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6"/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* 01. 기본 인적 사항 (As-is 필드) */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase text-slate-900 tracking-widest"><Building className="w-4 h-4"/> 01. Profile Info</h4>
                  <div className="space-y-4 p-8 bg-slate-50 rounded-[2.5rem]">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">업체명 *</label><input required className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm" value={formData.company_name || ""} onChange={e => setFormData({...formData, company_name: e.target.value})}/></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">성명(대표자)</label><input className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm" value={formData.customer_name || ""} onChange={e => setFormData({...formData, customer_name: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">핸드폰</label><input className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm text-blue-600" value={formData.mobile_phone || ""} onChange={e => setFormData({...formData, mobile_phone: e.target.value})}/></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">유선전화</label><input className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm" value={formData.landline_phone || ""} onChange={e => setFormData({...formData, landline_phone: e.target.value})}/></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주소</label><input className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm" value={formData.address || ""} onChange={e => setFormData({...formData, address: e.target.value})}/></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비고(특이사항)</label><textarea rows={3} className="w-full p-6 rounded-3xl bg-white border-none font-bold text-sm shadow-sm resize-none" value={formData.note || ""} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
                  </div>
                </div>

                {/* 02. TM 상담 정보 (As-is 필드) */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase text-blue-600 tracking-widest"><Mic className="w-4 h-4"/> 02. Consultation</h4>
                  <div className="space-y-4 p-8 bg-blue-50/30 rounded-[2.5rem] border border-blue-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">배정 상담사</label>
                        <select className="w-full h-14 px-4 rounded-2xl bg-white border-none font-bold text-sm" value={formData.tm_id || ""} onChange={e => setFormData({...formData, tm_id: e.target.value})}>
                          <option value="">미배정</option>
                          {users.filter(u => u.role_name === 'TM').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">상담상태</label>
                        <select className="w-full h-14 px-4 rounded-2xl bg-white border-none font-bold text-sm" value={formData.consult_status || "선택"} onChange={e => setFormData({...formData, consult_status: e.target.value})}>
                          {["선택", "미배정", "대기", "부재", "관리", "거절", "방문약속"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">상담일자</label><input type="datetime-local" className="w-full h-14 px-6 rounded-2xl bg-white border-none font-bold text-sm" value={formData.consult_date || ""} onChange={e => setFormData({...formData, consult_date: e.target.value})}/></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">상담 상세내용</label><textarea rows={4} className="w-full p-6 rounded-3xl bg-white border-none font-bold text-sm resize-none" value={formData.consult_memo || ""} onChange={e => setFormData({...formData, consult_memo: e.target.value})} /></div>
                    <div className="space-y-2 pt-2">
                       <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest ml-1">Recording Logs</label>
                       <div className="h-12 bg-white rounded-xl border border-dashed border-blue-200 flex items-center justify-center text-[10px] font-black text-blue-300 gap-2 cursor-pointer hover:bg-blue-100 transition-all"><FileAudio className="w-4 h-4"/> 녹취파일 01</div>
                       <div className="h-12 bg-white rounded-xl border border-dashed border-blue-200 flex items-center justify-center text-[10px] font-black text-blue-300 gap-2 cursor-pointer hover:bg-blue-100 transition-all"><FileAudio className="w-4 h-4"/> 녹취파일 02</div>
                    </div>
                  </div>
                </div>

                {/* 03. 영업 및 정산 정보 (As-is 필드) */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase text-violet-600 tracking-widest"><Wallet className="w-4 h-4"/> 03. Sales & Revenue</h4>
                  <div className="space-y-4 p-8 bg-violet-50/30 rounded-[2.5rem] border border-violet-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">배정 영업원</label>
                        <select className="w-full h-14 px-4 rounded-2xl bg-white border-none font-bold text-sm" value={formData.sales_id || ""} onChange={e => setFormData({...formData, sales_id: e.target.value})}>
                          <option value="">선택</option>
                          {users.filter(u => u.role_name === '영업').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">영업상태</label>
                        <select className="w-full h-14 px-4 rounded-2xl bg-white border-none font-bold text-sm" value={formData.sales_status || "선택"} onChange={e => setFormData({...formData, sales_status: e.target.value})}>
                          {["방문 전", "진행중", "계약완료", "보류", "조회요청", "조회거절", "분납", "정산완료"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">영업수당 (Settlement)</label><input type="number" className="w-full h-14 px-6 rounded-2xl bg-white border-none font-black text-sm text-violet-600" value={formData.sales_commission || 0} onChange={e => setFormData({...formData, sales_commission: Number(e.target.value)})}/></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-1">영업 상세메모</label><textarea rows={7} className="w-full p-6 rounded-3xl bg-white border-none font-bold text-sm resize-none" value={formData.sales_memo || ""} onChange={e => setFormData({...formData, sales_memo: e.target.value})} /></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-10 border-t border-slate-100 items-center justify-between">
                <div className="flex items-center gap-4 bg-slate-50 px-8 py-5 rounded-[2rem] text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                  <CalendarDays className="w-4 h-4" /> Final Receipt: {formData.receipt_date}
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 h-20 rounded-[2rem] font-black text-slate-400 hover:text-slate-900 transition-all text-xs uppercase tracking-widest">Cancel Dismiss</button>
                  <button type="submit" className="px-20 h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xs shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest">Deployment Commit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}