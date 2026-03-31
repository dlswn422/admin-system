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
  Layers
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
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-6 font-sans">
      
      {/* --- 상단 헤더 섹션 (구조 개편) --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
            Navigation System
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic font-serif">메뉴 관리</h1>
            <p className="text-slate-400 font-medium max-w-md leading-relaxed text-sm">
              시스템 사이드바의 핵심 내비게이션 구조와 접근 경로를 정밀 설계합니다.
            </p>
          </div>

          {/* 💡 개편된 요약 정보 (카드가 아닌 텍스트 대시보드 형태) */}
          <div className="flex items-center gap-12 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Total Nodes</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{menus.length.toString().padStart(2, '0')}</p>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-100" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Engine Status</p>
                <p className="text-2xl font-black text-emerald-500 tracking-tighter italic font-serif">Active</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 우측 버튼 그룹 */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <button 
            onClick={fetchMenus}
            className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
          >
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white hover:bg-slate-900 shadow-xl shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" />
            <span>메뉴 추가</span>
          </button>
        </div>
      </div>

      {/* --- 그리드 리스트 (본문 카드) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 rounded-[2.5rem] bg-slate-50 animate-pulse" />)
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className="flex flex-col h-full justify-between gap-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 italic font-serif">
                    {menu.icon}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    PRIO: {menu.sort_order}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none group-hover:text-blue-600 transition-colors">{menu.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] font-bold truncate">
                    <Link2 className="w-3 h-3 text-blue-400" />
                    {menu.path}
                  </div>
                </div>

                {/* 카드 액션 버튼 (호버 시 노출) */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => openModal(menu)} className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                    <Settings2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="h-11 w-11 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-slate-50 opacity-40 group-hover:scale-150 transition-transform duration-700" />
            </div>
          ))
        )}
      </div>

      {/* --- 모달 (UI 생략 없이 동일 적용) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/20 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-16 shadow-2xl border border-white animate-in zoom-in-95 duration-500 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic font-serif mb-3 uppercase">{selectedMenu ? "Modify Node" : "New Node"}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Navigation Architecture</p>
            </div>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">메뉴 이름</label>
                  <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold focus:ring-4 ring-blue-600/5 transition-all text-slate-900" placeholder="예: 고객 관리" />
                </div>
                <div className="col-span-4 space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center block">아이콘</label>
                  <input type="text" value={formData.icon} onChange={(e)=>setFormData({...formData, icon: e.target.value})} className="w-full h-16 rounded-2xl bg-slate-50 border-none text-3xl text-center focus:ring-4 ring-blue-600/5 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">시스템 경로</label>
                <input type="text" required value={formData.path} onChange={(e)=>setFormData({...formData, path: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-mono font-bold focus:ring-4 ring-blue-600/5 transition-all text-blue-600" placeholder="/customers" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">출력 순서</label>
                <div className="relative">
                  <input type="number" value={formData.sort_order} onChange={(e)=>setFormData({...formData, sort_order: Number(e.target.value)})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold focus:ring-4 ring-blue-600/5 transition-all text-slate-900" />
                  <ListOrdered className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-20 rounded-[2rem] font-black text-slate-400 hover:text-slate-900 transition-all text-xs uppercase tracking-widest">취소</button>
                <button type="submit" className="flex-[2] h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xs shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}