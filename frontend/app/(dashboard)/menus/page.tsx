"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  RotateCw, 
  Navigation, 
  Settings2, 
  Trash2, 
  CheckCircle2,
  ListOrdered,
  X,
  Link2,
  Layers,
  Terminal,
  Activity
} from "lucide-react";

interface Menu {
  id: string;
  title: string;
  path: string;
  icon: string;
  sort_order: number;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({ title: "", path: "", icon: "📁", sort_order: 1 });

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/menus?all=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenus(data.sort((a: Menu, b: Menu) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      console.error("데이터 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMenus(); }, []);

  const openModal = (menu: Menu | null = null) => {
    if (menu) {
      setSelectedMenu(menu);
      setFormData({ title: menu.title, path: menu.path, icon: menu.icon, sort_order: menu.sort_order });
    } else {
      setSelectedMenu(null);
      setFormData({ title: "", path: "/", icon: "📁", sort_order: menus.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedMenu;
    const url = isEdit ? `/api/menus/${selectedMenu.id}` : "/api/menus";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchMenus();
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-8 font-sans bg-[#fcfcfd]">
      
      {/* --- 헤더 섹션 (코드 관리와 완벽 일치) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-lg shadow-slate-200">
            <Layers className="w-3 h-3" /> Navigation Hub
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none italic font-serif">메뉴 관리</h1>
          <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm">
            시스템 사이드바의 핵심 내비게이션 구조와 접근 경로를 정밀 설계하고 우선순위를 제어합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchMenus} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-xl transition-all flex items-center justify-center active:scale-95 shadow-sm">
            <RotateCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-2xl shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> New Module
          </button>
        </div>
      </div>

      {/* --- 요약 지표 (코드 관리 스타일 그리드) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm group hover:border-blue-200 transition-all">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Total Nodes</span>
          <div className="flex items-center gap-4 mt-2">
             <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <Navigation className="w-6 h-6" />
             </div>
             <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{menus.length.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-200 transition-all">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Engine Status</span>
          <div className="flex items-center gap-4 mt-2">
             <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
             </div>
             <span className="text-4xl font-black text-slate-900 tracking-tighter italic font-serif">Active</span>
          </div>
        </div>
      </div>

      {/* --- 그리드형 카드 리스트 (코드 관리 좌측 카드 디자인 활용) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-[3rem] bg-white border border-slate-100 animate-pulse" />
          ))
        ) : (
          menus.map((menu) => (
            <div 
              key={menu.id} 
              className="group relative bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:border-blue-100 transition-all duration-500 overflow-hidden"
            >
              <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="h-20 w-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-4xl shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 italic font-serif">
                    {menu.icon}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Seq: {menu.sort_order.toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none group-hover:text-blue-600 transition-colors">
                    {menu.title}
                  </h3>
                  <div className="flex items-center gap-2 text-blue-500 font-mono text-xs font-bold truncate bg-blue-50/50 w-fit px-3 py-1 rounded-lg">
                    <Link2 className="w-3.5 h-3.5" />
                    {menu.path}
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  <button 
                    onClick={() => openModal(menu)} 
                    className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                  >
                    <Settings2 className="w-4 h-4" /> Config
                  </button>
                  <button 
                    className="h-14 w-14 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* 카드 장식 (코드 관리 디자인 요소) */}
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-slate-50 opacity-40 group-hover:scale-150 group-hover:bg-blue-50 transition-all duration-700" />
            </div>
          ))
        )}
      </div>

      {/* --- 설정 모달 (코드 관리 모달 디자인과 완벽 일치) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-10 right-10 h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">
                {selectedMenu ? "Modify Node" : "Create Node"}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Navigation Architecture Settings</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Display Label</label>
                  <input 
                    type="text" required 
                    value={formData.title} 
                    onChange={(e)=>setFormData({...formData, title: e.target.value})} 
                    className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold text-slate-900 focus:ring-4 ring-blue-500/5 outline-none transition-all" 
                    placeholder="예: 고객 관리" 
                  />
                </div>
                <div className="col-span-4 space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center block">Icon</label>
                  <input 
                    type="text" 
                    value={formData.icon} 
                    onChange={(e)=>setFormData({...formData, icon: e.target.value})} 
                    className="w-full h-18 rounded-[2rem] bg-slate-50 border-none text-3xl text-center focus:ring-4 ring-blue-500/5 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">System Routing Path</label>
                <input 
                  type="text" required 
                  value={formData.path} 
                  onChange={(e)=>setFormData({...formData, path: e.target.value})} 
                  className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-mono font-bold text-blue-600 focus:ring-4 ring-blue-500/5 outline-none transition-all" 
                  placeholder="/customers" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Sequence Priority</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.sort_order} 
                    onChange={(e)=>setFormData({...formData, sort_order: Number(e.target.value)})} 
                    className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/5 transition-all" 
                  />
                  <ListOrdered className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-20 rounded-[2.5rem] font-black text-slate-400 hover:text-slate-900 transition-all text-[10px] uppercase tracking-widest">Dismiss</button>
                <button type="submit" className="flex-[2] h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Deploy Change</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}