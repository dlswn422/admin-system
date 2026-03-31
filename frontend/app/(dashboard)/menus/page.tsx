"use client";

import { useEffect, useState, useCallback } from "react";

interface Menu {
  id: string;
  title: string;    // DB 필드명 title 매칭
  path: string;     // DB 필드명 path 매칭
  icon: string;
  sort_order: number; // DB 필드명 sort_order 매칭
  created_at: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({ title: "", path: "", icon: "📁", sort_order: 1 });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/menus");
      const data = await res.json();
      // sort_order 기준으로 정렬하여 상태 업데이트
      setMenus(data.sort((a: Menu, b: Menu) => a.sort_order - b.sort_order));
    } catch (error) {
      showToast("데이터 동기화 실패", "error");
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
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `/api/menus/${selectedMenu.id}` : "/api/menus";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEdit ? "경로 설정이 업데이트되었습니다." : "새 인터페이스가 등록되었습니다.");
        setIsModalOpen(false);
        fetchMenus();
      }
    } catch (error) {
      showToast("서버 통신 오류", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 메뉴를 삭제하면 모든 역할의 접근 권한도 함께 사라집니다. 진행하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("메뉴가 영구 삭제되었습니다.");
        fetchMenus();
      }
    } catch (error) {
      showToast("삭제 처리 실패", "error");
    }
  };

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- 상단 알림 --- */}
      {toast && (
        <div className={`fixed top-8 right-8 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right-10 duration-500 border border-white/20 backdrop-blur-md ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <span className="text-lg">{toast.type === "success" ? "⚙️" : "⚠️"}</span>
          <p className="text-sm font-black tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* --- 헤더 섹션 --- */}
      <div className="flex items-center justify-between bg-white/60 p-10 rounded-[3.5rem] border border-white backdrop-blur-xl shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic font-serif">System Routes</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 ml-1">Interface Structure & Access Mapping</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 hover:scale-110 transition-all active:scale-95"
        >
          <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
        </button>
      </div>

      {/* --- 메뉴 리스트 (개편된 카드 그리드) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em] text-xs">Rebuilding Navigation...</div>
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="group relative overflow-hidden rounded-[3rem] border border-white bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex gap-6">
                  {/* 아이콘 박스 */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-slate-50 text-3xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    {menu.icon}
                  </div>
                  
                  {/* 정보 섹션 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{menu.title}</h4>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Ord. {menu.sort_order}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 font-mono tracking-tight">{menu.path}</p>
                    <div className="pt-3 flex items-center gap-2">
                       <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Route</span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2">
                  <button onClick={() => openModal(menu)} className="rounded-2xl border border-slate-100 bg-white px-6 py-3 text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest shadow-sm">Config</button>
                  <button onClick={() => handleDelete(menu.id)} className="rounded-2xl border border-rose-50 bg-white px-6 py-3 text-[10px] font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest shadow-sm">Delete</button>
                </div>
              </div>
              
              {/* 배경 장식 */}
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-slate-900 opacity-[0.015] group-hover:opacity-[0.04] transition-all duration-700" />
            </div>
          ))
        )}
      </div>

      {/* --- 설정 모달 --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[3.5rem] border border-white/20 bg-white p-14 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="mb-12 text-center">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedMenu ? "Modify Interface" : "New Terminal Entry"}</h3>
              <p className="mt-3 text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">Configure System Navigation Node</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
              <div className="col-span-1 space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Label</label>
                <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-7 py-5 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 shadow-inner" placeholder="예: 대시보드" />
              </div>
              <div className="col-span-1 space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon Representation</label>
                <input type="text" value={formData.icon} onChange={(e)=>setFormData({...formData, icon: e.target.value})} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-7 py-5 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 text-center text-xl shadow-inner" />
              </div>
              <div className="col-span-2 space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">System Redirect Path (Href)</label>
                <input type="text" required value={formData.path} onChange={(e)=>setFormData({...formData, path: e.target.value})} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-7 py-5 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 font-mono shadow-inner" placeholder="/dashboard" />
              </div>
              <div className="col-span-2 space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Sequence Priority (Sort Order)</label>
                <input type="number" value={formData.sort_order} onChange={(e)=>setFormData({...formData, sort_order: Number(e.target.value)})} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-7 py-5 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 shadow-inner" />
              </div>

              <div className="col-span-2 flex gap-5 pt-8">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 rounded-[1.8rem] bg-slate-100 py-6 font-black text-slate-500 hover:bg-slate-200 text-xs uppercase tracking-[0.2em] transition-all">Dismiss</button>
                <button type="submit" className="flex-[2] rounded-[1.8rem] bg-[#020617] py-6 font-black text-white shadow-2xl hover:bg-blue-600 transition-all text-xs uppercase tracking-[0.2em]">Deploy Config</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}