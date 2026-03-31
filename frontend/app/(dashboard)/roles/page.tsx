"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  ShieldCheck, 
  RotateCw, 
  Key, 
  LayoutGrid, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  Fingerprint,
  Plus,
  X,
  Lock
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  created_at: string;
}

interface Menu {
  id: string;
  title: string;
  icon: string;
  path: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: "" });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        fetch("/api/roles"), 
        fetch("/api/menus?all=true") 
      ]);
      const rData = await rRes.json();
      const mData = await mRes.json();
      setRoles(Array.isArray(rData) ? rData : []);
      setAllMenus(Array.isArray(mData) ? mData : []);
    } catch (error) {
      showToast("데이터 동기화 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => 
      role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  const openModal = async (role: Role | null = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({ name: role.name });
      try {
        const res = await fetch(`/api/roles/access?role_id=${role.id}`);
        const accessData = await res.json();
        if (Array.isArray(accessData)) {
          setSelectedMenuIds(accessData.map((item: any) => item.menu_id));
        }
      } catch (e) {
        setSelectedMenuIds([]);
      }
    } else {
      setSelectedRole(null);
      setFormData({ name: "" });
      setSelectedMenuIds([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedRole;
    try {
      const res = await fetch(isEdit ? `/api/roles/${selectedRole?.id}` : "/api/roles", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, menu_ids: selectedMenuIds }),
      });
      if (res.ok) {
        showToast(isEdit ? "설정이 변경되었습니다." : "새 역할이 등록되었습니다.");
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showToast("처리 중 오류 발생", "error");
    }
  };

  const confirmDelete = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("역할이 삭제되었습니다.");
        setIsDeleteModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showToast("삭제 실패", "error");
    }
  };

  const toggleMenuSelection = (menuId: string) => {
    setSelectedMenuIds(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-8 font-sans bg-[#fcfcfd]">
      
      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-10 right-10 z-[11000] flex items-center gap-3 rounded-3xl px-8 py-5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-in slide-in-from-right-10 duration-500 ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="font-bold tracking-tight text-sm uppercase">{toast.message}</p>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-lg shadow-violet-200">
            <Lock className="w-3 h-3" /> Security Authority
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none italic font-serif">역할 관리</h1>
          <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm">
            직무별 권한 그룹을 설계하고 시스템 모듈에 대한 접근 범위를 정밀 제어합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 hover:text-violet-600 hover:shadow-xl transition-all flex items-center justify-center active:scale-95 shadow-sm">
            <RotateCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-600 shadow-2xl transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> New Role
          </button>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Roles", value: roles.length, icon: ShieldCheck, color: "violet" },
          { label: "Connected Menus", value: allMenus.length, icon: LayoutGrid, color: "blue" },
          { label: "System Admin", value: roles.filter(r => r.name.includes("관리자")).length, icon: Key, color: "indigo" },
          { label: "Status", value: "Normal", icon: Fingerprint, color: "emerald", isText: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm group hover:border-violet-200 transition-all">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{stat.label}</span>
            <div className="flex items-center gap-4 mt-2">
               <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
                  <stat.icon className="w-6 h-6" />
               </div>
               <span className="text-4xl font-black text-slate-900 tracking-tighter italic font-serif tabular-nums">
                  {stat.isText ? stat.value : stat.value.toString().padStart(2, '0')}
               </span>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 바 */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-violet-600 transition-colors" />
          <input 
            type="text" 
            placeholder="검색할 역할 이름을 입력하세요..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[1.5rem] border-none bg-slate-100/50 pl-16 pr-6 py-5 text-sm font-bold outline-none focus:ring-4 ring-violet-500/5 transition-all text-slate-900" 
          />
        </div>
      </div>

      {/* 리스트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 rounded-[3rem] bg-white border border-slate-100 animate-pulse" />)
        ) : filteredRoles.map((role) => (
          <div key={role.id} className="group relative bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(124,58,237,0.1)] hover:border-violet-100 transition-all duration-500 overflow-hidden">
            <div className="flex flex-col h-full justify-between gap-8 relative z-10">
              <div className="flex justify-between items-start">
                <div className="h-20 w-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-3xl font-black text-slate-400 shadow-inner group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 italic font-serif">
                  {role.name[0]}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  {role.id.split('-')[0]}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none group-hover:text-violet-600 transition-colors">{role.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated: {new Date(role.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                <button onClick={() => openModal(role)} className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 transition-all shadow-xl active:scale-95">
                  <Edit3 className="w-4 h-4" /> Mapping
                </button>
                <button onClick={() => { setSelectedRole(role); setIsDeleteModalOpen(true); }} className="h-14 w-14 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-violet-50 opacity-40 group-hover:scale-150 transition-transform duration-700" />
          </div>
        ))}
      </div>

      {/* 권한 설정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 duration-500 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">
                {selectedRole ? "Authority Mapping" : "Create Authority"}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Access Control Specification</p>
            </div>

            <form onSubmit={handleSave} className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Role Display Name</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={(e)=>setFormData({name: e.target.value})} 
                  className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold focus:ring-4 ring-violet-600/5 outline-none transition-all text-slate-900" 
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Accessible Modules</label>
                  <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{selectedMenuIds.length} Selected</span>
                </div>
                
                {/* 💡 클릭 문제 해결을 위한 개선된 메뉴 선택 그리드 */}
                <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  {allMenus.map((menu) => {
                    const isSelected = selectedMenuIds.includes(menu.id);
                    return (
                      <div key={menu.id} className="relative">
                        <input 
                          type="checkbox" 
                          id={`menu-${menu.id}`}
                          checked={isSelected}
                          onChange={() => toggleMenuSelection(menu.id)}
                          className="peer hidden" 
                        />
                        <label 
                          htmlFor={`menu-${menu.id}`}
                          className={`group flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 active:scale-95
                            ${isSelected 
                              ? 'bg-white border-violet-500 shadow-lg shadow-violet-100 text-violet-600' 
                              : 'bg-white/40 border-transparent text-slate-400 grayscale hover:grayscale-0 hover:border-slate-200'
                            }`}
                        >
                          <span className={`text-2xl transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {menu.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black truncate uppercase tracking-tighter ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                              {menu.title}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white animate-in zoom-in duration-300">
                              <Check className="w-3 h-3 stroke-[3px]" />
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 h-20 rounded-[2.5rem] font-black text-slate-400 hover:text-slate-900 transition-all text-xs uppercase tracking-widest">Dismiss</button>
                <button type="submit" className="flex-[2] h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Commit Mapping</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[3rem] bg-white p-12 shadow-2xl text-center border border-white">
            <div className="mb-8 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2.2rem] bg-rose-50 text-rose-500 text-6xl animate-bounce italic font-serif shadow-inner font-black">!</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic font-serif">Destruct Role</h3>
            <p className="mt-4 text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">해당 역할을 시스템에서<br />영구히 제거하시겠습니까?</p>
            <div className="mt-12 flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full h-16 rounded-2xl bg-rose-600 font-black text-white shadow-xl hover:bg-rose-700 transition-all text-[10px] uppercase tracking-widest">Confirm Destruction</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full h-16 rounded-2xl bg-slate-50 font-black text-slate-400 hover:text-slate-900 transition-all text-[10px] uppercase tracking-widest">Abort</button>
            </div>
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