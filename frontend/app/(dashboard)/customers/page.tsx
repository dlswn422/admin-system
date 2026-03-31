"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  UserPlus, Search, RotateCw, UserCircle, Phone, 
  ChevronDown, Filter, Trash2, Edit3, Check, Building,
  CalendarDays, MapPin, NotebookTabs, X, 
  ChevronLeft, ChevronRight, FileAudio, Smartphone, Download,
  Wallet, Mic, Activity, Headphones, Layers, Link2
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✨ 공통 코드 상태 추가
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);

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

  // 💡 데이터 및 공통 코드 로드
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      
      // 공통 코드 그룹 ID를 찾기 위해 또는 직접 그룹코드로 조회하는 API 호출
      const [cRes, uRes, consultCodeRes, salesCodeRes] = await Promise.all([
        fetch(`/api/customers?${query}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"), // 👈 공통코드 API
        fetch("/api/codes/details/by-group?group_code=SALES_STATUS")   // 👈 공통코드 API
      ]);

      const cData = await cRes.json();
      const uData = await uRes.json();
      const consultCodesData = await consultCodeRes.json();
      const salesCodesData = await salesCodeRes.json();

      setCustomers(Array.isArray(cData) ? cData : []);
      setUsers(uData || []);
      setConsultCodes(consultCodesData || []);
      setSalesCodes(salesCodesData || []);
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, [filters.tm_id, filters.consult_status, filters.sales_status]);

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
        consult_status: consultCodes[0]?.code_name || "대기",
        sales_status: salesCodes[0]?.code_name || "방문 전",
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
    if (res.ok) { setIsModalOpen(false); fetchInitialData(); }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-8 font-sans bg-[#fcfcfd]">
      
      {/* --- 헤더 섹션 --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-lg">
            <Layers className="w-3 h-3" /> CRM Pipeline Engine
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none italic font-serif">고객 통합 관리</h1>
          <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm">
            상담 내역, 실시간 녹취 기록 및 영업 정산 데이터를 아우르는 통합 비즈니스 컨트롤 센터입니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchInitialData} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-xl transition-all flex items-center justify-center active:scale-95 shadow-sm">
            <RotateCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-2xl shadow-blue-200 transition-all active:scale-95">
            <UserPlus className="w-5 h-5" /> <span>신규 고객 추가</span>
          </button>
        </div>
      </div>

      {/* --- 통합 필터 컨트롤러 --- */}
      <div className="bg-white border border-slate-100 rounded-[3rem] p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2 relative">
            <select value={filters.date_type} onChange={e => setFilters({...filters, date_type: e.target.value})} className="w-full h-16 appearance-none rounded-2xl bg-slate-50 border-none px-6 text-sm font-black outline-none focus:ring-4 ring-blue-500/5">
              <option>접수일</option><option>상담일자</option><option>영업일자</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
          </div>
          <div className="lg:col-span-4 flex items-center gap-3">
            <input type="date" className="flex-1 h-16 rounded-2xl bg-slate-50 border-none px-4 text-sm font-bold outline-none" />
            <span className="text-slate-300 font-black">~</span>
            <input type="date" className="flex-1 h-16 rounded-2xl bg-slate-50 border-none px-4 text-sm font-bold outline-none" />
          </div>
          <div className="lg:col-span-4 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input placeholder="업체명, 성함, 연락처 통합 검색..." className="w-full h-16 pl-16 pr-6 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-4 ring-blue-500/5 transition-all outline-none" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          <button onClick={fetchInitialData} className="lg:col-span-2 h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">Search Filter</button>
        </div>
      </div>

      {/* --- 데이터 프리미엄 리스트 --- */}
      <div className="bg-white border border-slate-100 rounded-[3.5rem] p-4 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <th className="px-10 py-4">Client Identity</th>
                <th className="px-8 py-4 text-center">Consulting</th>
                <th className="px-8 py-4 text-center">Sales Logic</th>
                <th className="px-10 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="py-40 text-center text-slate-300 animate-pulse font-black uppercase text-xs tracking-widest italic">Synchronizing Operational Data...</td></tr>
              ) : paginatedData.map((c) => (
                <tr key={c.id} className="group hover:scale-[1.005] transition-all duration-300 cursor-pointer" onClick={() => openModal(c)}>
                  <td className="px-10 py-7 rounded-l-[2.5rem] bg-slate-50/50 group-hover:bg-white border-l border-t border-b border-transparent group-hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-inner flex items-center justify-center font-black text-slate-400 text-xl italic font-serif group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                        {c.customer_name?.[0] || 'C'}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">{c.company_name || "Personal Client"}</p>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                          <UserCircle className="w-3 h-3 text-blue-500"/> {c.customer_name}
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <Smartphone className="w-3 h-3 text-blue-500"/> {c.mobile_phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center bg-slate-50/50 group-hover:bg-white border-t border-b border-transparent group-hover:border-slate-100">
                    <div className="text-sm font-black text-slate-900 uppercase italic font-serif">
                      {users.find(u => u.id === c.tm_id)?.name || "Unassigned"}
                    </div>
                    <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${c.consult_status === '방문약속' ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
                      {c.consult_status}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-center bg-slate-50/50 group-hover:bg-white border-t border-b border-transparent group-hover:border-slate-100">
                    <div className="text-sm font-black text-blue-600 uppercase italic font-serif">{c.sales_status}</div>
                    <div className="text-[10px] font-black text-slate-400 font-mono tracking-tighter mt-1">₩{c.sales_commission?.toLocaleString()}</div>
                  </td>
                  <td className="px-10 py-7 rounded-r-[2.5rem] bg-slate-50/50 group-hover:bg-white border-r border-t border-b border-transparent group-hover:border-slate-100 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button className="h-12 w-12 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:shadow-lg transition-all flex items-center justify-center active:scale-90"><Edit3 className="w-5 h-5" /></button>
                      <button className="h-12 w-12 rounded-xl bg-white border border-rose-100 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        <div className="px-10 py-8 flex items-center justify-between border-t border-slate-50 bg-slate-50/20">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Viewing Entry {currentPage} / {totalPages || 1}</span>
          <div className="flex gap-3">
            <button disabled={currentPage === 1} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20 active:scale-90 shadow-sm"><ChevronLeft className="w-5 h-5"/></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20 active:scale-90 shadow-sm"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
      </div>

      {/* --- 마스터 데이터 에디터 모달 --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-6xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar relative">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6"/></button>
            
            <div className="mb-14">
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic font-serif uppercase">Customer Node Editor</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Integrated Pipeline Logic Specification</p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* 01. Profile Area */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-blue-600" />
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-widest">01. Identity</h4>
                  </div>
                  <div className="space-y-5 p-10 bg-slate-50 rounded-[3rem]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
                      <input required className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-base shadow-sm focus:ring-4 ring-blue-500/5 transition-all outline-none" value={formData.company_name || ""} onChange={e => setFormData({...formData, company_name: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Representative</label>
                      <input className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-base shadow-sm outline-none" value={formData.customer_name || ""} onChange={e => setFormData({...formData, customer_name: e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                        <input className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-base shadow-sm outline-none text-blue-600" value={formData.mobile_phone || ""} onChange={e => setFormData({...formData, mobile_phone: e.target.value})}/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Landline</label>
                        <input className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-base shadow-sm outline-none" value={formData.landline_phone || ""} onChange={e => setFormData({...formData, landline_phone: e.target.value})}/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Address</label>
                      <input className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-base shadow-sm outline-none" value={formData.address || ""} onChange={e => setFormData({...formData, address: e.target.value})}/>
                    </div>
                  </div>
                </div>

                {/* 02. Consultation Area (✨ 공통코드 연동) */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-emerald-500" />
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-widest">02. Consulting</h4>
                  </div>
                  <div className="space-y-5 p-10 bg-emerald-50/30 rounded-[3rem] border border-emerald-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Assign TM</label>
                        <select className="w-full h-16 px-4 rounded-2xl bg-white border-none font-bold text-sm shadow-sm outline-none" value={formData.tm_id || ""} onChange={e => setFormData({...formData, tm_id: e.target.value})}>
                          <option value="">미배정</option>
                          {users.filter(u => u.role_name === 'TM').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">상담 상태</label>
                        <select className="w-full h-16 px-4 rounded-2xl bg-white border-none font-bold text-sm shadow-sm outline-none" value={formData.consult_status || ""} onChange={e => setFormData({...formData, consult_status: e.target.value})}>
                          {consultCodes.map(code => (
                            <option key={code.code_value} value={code.code_name}>{code.code_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">상담 일자</label>
                      <input type="datetime-local" className="w-full h-16 px-6 rounded-2xl bg-white border-none font-bold text-sm shadow-sm outline-none" value={formData.consult_date || ""} onChange={e => setFormData({...formData, consult_date: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Consulting Logs</label>
                      <textarea rows={6} className="w-full p-6 rounded-[2rem] bg-white border-none font-bold text-sm shadow-sm resize-none outline-none" value={formData.consult_memo || ""} onChange={e => setFormData({...formData, consult_memo: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 03. Sales Area (✨ 공통코드 연동) */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-blue-600" />
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-widest">03. Performance</h4>
                  </div>
                  <div className="space-y-5 p-10 bg-blue-50/30 rounded-[3rem] border border-blue-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Assign Sales</label>
                        <select className="w-full h-16 px-4 rounded-2xl bg-white border-none font-bold text-sm shadow-sm outline-none" value={formData.sales_id || ""} onChange={e => setFormData({...formData, sales_id: e.target.value})}>
                          <option value="">선택</option>
                          {users.filter(u => u.role_name === '영업').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">영업 상태</label>
                        <select className="w-full h-16 px-4 rounded-2xl bg-white border-none font-bold text-sm shadow-sm outline-none" value={formData.sales_status || ""} onChange={e => setFormData({...formData, sales_status: e.target.value})}>
                          {salesCodes.map(code => (
                            <option key={code.code_value} value={code.code_name}>{code.code_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Commission Amount</label>
                      <input type="number" className="w-full h-16 px-6 rounded-2xl bg-white border-none font-black text-lg shadow-sm outline-none text-blue-600" value={formData.sales_commission || 0} onChange={e => setFormData({...formData, sales_commission: Number(e.target.value)})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Performance Note</label>
                      <textarea rows={6} className="w-full p-6 rounded-[2rem] bg-white border-none font-bold text-sm shadow-sm resize-none outline-none" value={formData.sales_memo || ""} onChange={e => setFormData({...formData, sales_memo: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 푸터 바 */}
              <div className="flex gap-4 pt-10 border-t border-slate-100 items-center justify-between">
                <div className="flex items-center gap-4 bg-slate-50 px-10 py-6 rounded-full text-[11px] font-black text-slate-400 uppercase tracking-widest italic font-serif">
                  <CalendarDays className="w-5 h-5 text-blue-500" /> System Receipt: {formData.receipt_date}
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 h-20 rounded-full font-black text-slate-400 hover:text-slate-900 transition-all text-xs uppercase tracking-widest">Dismiss</button>
                  <button type="submit" className="px-24 h-20 rounded-full bg-slate-900 text-white font-black text-xs shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest">Commit Operational Node</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}