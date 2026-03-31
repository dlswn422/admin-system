"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Plus, 
  RotateCw, 
  Search, 
  Settings2, 
  Trash2, 
  ExternalLink, 
  Navigation, 
  Layers, 
  ListOrdered,
  CheckCircle2
} from "lucide-react";

interface Menu {
  id: string;
  title: string;
  path: string;
  icon: string;
  sort_order: number;
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
    const url = isEdit ? `/api/menus/${selectedMenu.id}` : "/api/menus";

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEdit ? "경로 설정이 업데이트되었습니다." : "새 메뉴가 등록되었습니다.");
        setIsModalOpen(false);
        fetchMenus();
      }
    } catch (error) {
      showToast("서버 통신 오류", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 메뉴를 삭제하면 연결된 모든 권한 데이터가 함께 소멸됩니다. 계속하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("메뉴가 영구 삭제되었습니다.");
        fetchMenus();
      }
    } catch (error) {
      showToast("삭제 실패", "error");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-6">
      
      {/* --- 상단 토스트 알림 --- */}
      {toast && (
        <div className={`fixed top-10 right-10 z-[11000] flex items-center gap-3 rounded-3xl px-8 py-5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-in slide-in-from-right-10 ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="font-bold tracking-tight text-sm">{toast.message}</p>
        </div>
      )}

      {/* --- 헤더 섹션 (전체 톤앤매너 통일) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
            Navigation Architecture
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">메뉴 구성</h1>
          <p className="text-slate-400 font-medium max-w-md leading-relaxed">
            시스템 사이드바에 노출될 메뉴 노드를 정의하고 정렬 순서를 관리합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchMenus}
            className="flex items-center justify-center h-16 w-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all group active:scale-95"
          >
            <RotateCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-3 rounded-3xl bg-slate-900 px-8 py-5 text-sm font-black text-white hover:bg-blue-600 shadow-2xl shadow-blue-300 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>신규 메뉴 추가</span>
          </button>
        </div>
      </div>

      {/* --- 요약 지표 (슬림 카드) --- */}
      <div className="flex flex-wrap gap-12 mb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Total Routes</span>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{menus.length.toString().padStart(2, '0')}</span>
            <Navigation className="w-5 h-5 text-blue-200" />
          </div>
        </div>
        <div className="space-y-1 border-l border-slate-100 pl-12 font-serif italic">
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] not-italic">Status</span>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-blue-600 tracking-tighter">Live</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* --- 가로형 카드 리스트 --- */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-40 text-center text-slate-300 animate-pulse font-black tracking-widest uppercase text-xs">Rebuilding Interface...</div>
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex items-center justify-between">
              <div className="flex items-center gap-8 relative z-10">
                {/* 아이콘 섹션 */}
                <div className="h-20 w-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-4xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 italic">
                  {menu.icon}
                </div>
                
                {/* 텍스트 정보 섹션 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{menu.title}</h3>
                    <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Seq. {menu.sort_order}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-mono text-sm font-bold">
                    <ExternalLink className="w-3 h-3" />
                    {menu.path}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 섹션 */}
              <div className="flex items-center gap-3 relative z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <button 
                  onClick={() => openModal(menu)} 
                  className="flex items-center gap-2 h-14 px-8 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                >
                  <Settings2 className="w-4 h-4" />
                  Config
                </button>
                <button 
                  onClick={() => handleDelete(menu.id)} 
                  className="h-14 w-14 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* 배경 장식 (미세한 패턴) */}
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-slate-50 opacity-40 group-hover:bg-blue-50 transition-colors" />
            </div>
          ))
        )}
      </div>

      {/* --- 설정 모달 (하이엔드 스타일) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/20 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-16 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic font-serif mb-3">
                {selectedMenu ? "Modify Route" : "New Terminal"}
              </h3>
              <p className="text-base font-bold text-slate-400">네비게이션 노드의 경로 및 우선순위를 설정합니다.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest ml-2">Label</label>
                  <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold focus:ring-4 ring-blue-600/5 transition-all text-slate-900" placeholder="예: 대시보드" />
                </div>
                <div className="space-y-2 text-center">
                  <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Icon</label>
                  <input type="text" value={formData.icon} onChange={(e)=>setFormData({...formData, icon: e.target.value})} className="w-full h-16 rounded-2xl bg-slate-50 border-none text-3xl text-center focus:ring-4 ring-blue-600/5 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest ml-2">System Path</label>
                <input type="text" required value={formData.path} onChange={(e)=>setFormData({...formData, path: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-mono font-bold focus:ring-4 ring-blue-600/5 transition-all text-blue-600" placeholder="/dashboard" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest ml-2">Sequence Priority</label>
                <div className="relative">
                  <input type="number" value={formData.sort_order} onChange={(e)=>setFormData({...formData, sort_order: Number(e.target.value)})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold focus:ring-4 ring-blue-600/5 transition-all text-slate-900" />
                  <ListOrdered className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-20 rounded-[1.8rem] font-black text-slate-400 hover:text-slate-900 transition-all text-sm uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] h-20 rounded-[1.8rem] bg-slate-900 text-white font-black text-sm shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest">Deploy Config</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}