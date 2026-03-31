"use client";

import { useEffect, useState, useCallback } from "react";

interface Role {
  id: string;
  name: string;
  created_at: string;
}

interface Menu {
  id: string;
  title: string;    // 💡 백엔드 필드명 title에 맞춤
  icon: string;
  path: string;     // 💡 백엔드 필드명 path에 맞춤
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        fetch("/api/menus")
      ]);
      const rData = await rRes.json();
      const mData = await mRes.json();
      
      setRoles(rData);
      setAllMenus(mData);
    } catch (error) {
      showToast("데이터 로딩 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = async (role: Role | null = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({ name: role.name });
      
      try {
        // 1. 해당 역할의 권한 데이터를 가져옵니다.
        const res = await fetch(`/api/roles/access?role_id=${role.id}`);
        if (!res.ok) throw new Error();
        
        const accessData = await res.json();
        
        // 2. [핵심] DB 컬럼명인 'menu_id'를 정확히 매핑해서 배열로 만듭니다.
        // 이 배열에 들어있는 ID와 체크박스의 ID가 일치해야 체크 표시가 불이 들어옵니다.
        const ids = accessData.map((item: any) => item.menu_id);
        
        console.log("가져온 권한 ID 목록:", ids); // 브라우저 콘솔에서 확인 가능
        setSelectedMenuIds(ids);
        
      } catch (e) {
        console.error("권한 데이터를 불러오지 못했습니다:", e);
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
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `/api/roles/${selectedRole.id}` : "/api/roles";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          menu_ids: selectedMenuIds 
        }),
      });

      if (res.ok) {
        showToast(isEdit ? "권한 설정이 변경되었습니다." : "새 역할이 등록되었습니다.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "처리 중 오류 발생", "error");
      }
    } catch (error) {
      showToast("서버 통신 오류", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 역할을 삭제하시겠습니까? 연결된 사용자가 있으면 실패할 수 있습니다.")) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("역할이 삭제되었습니다.");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "삭제 실패", "error");
      }
    } catch (error) {
      showToast("삭제 중 오류 발생", "error");
    }
  };

  const toggleMenuSelection = (menuId: string) => {
    setSelectedMenuIds(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {toast && (
        <div className={`fixed top-8 right-8 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right-10 duration-500 border border-white/20 backdrop-blur-md ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <span className="text-lg">{toast.type === "success" ? "✨" : "🚫"}</span>
          <p className="text-sm font-black tracking-tight">{toast.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Authority Management</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Define system access levels</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-3 rounded-2xl bg-[#020617] px-8 py-4 text-sm font-black text-white hover:bg-blue-600 shadow-xl transition-all active:scale-95">
          <span>+</span> NEW ROLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest">Loading...</div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-8 shadow-sm transition-all hover:shadow-2xl">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">🔑</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{role.id.split('-')[0]}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{role.name}</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Created: {new Date(role.created_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => openModal(role)} className="flex-1 rounded-xl bg-slate-50 py-3 text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">Edit</button>
                  <button onClick={() => handleDelete(role.id)} className="flex-1 rounded-xl bg-rose-50 py-3 text-[10px] font-black text-rose-500 hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest">Delete</button>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-slate-900 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-500" />
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl rounded-[3rem] border border-white/20 bg-white p-10 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="mb-8 text-center text-slate-900">
              <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedRole ? "Modify Role" : "Create Role"}</h3>
              <p className="mt-2 text-sm text-slate-400 font-bold uppercase tracking-widest">Define role identity & access</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Role Name</label>
                <input type="text" required value={formData.name} onChange={(e)=>setFormData({name: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 shadow-inner" />
              </div>

              {/* 💡 권한 체크박스 (백엔드 필드명 title, path 반영 버전) */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Menu Access Permissions</label>
                <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 shadow-inner max-h-56 overflow-y-auto">
                  {allMenus.map((menu) => (
                    <label key={menu.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:ring-2 hover:ring-blue-500/10 transition-all border border-slate-100 group">
                      <input 
                        type="checkbox" 
                        checked={selectedMenuIds.includes(menu.id)}
                        onChange={() => toggleMenuSelection(menu.id)}
                        className="h-5 w-5 accent-blue-600 rounded-md cursor-pointer"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{menu.icon}</span>
                          <span className="text-xs font-black text-slate-800 tracking-tight truncate">
                            {menu.title} {/* 💡 name -> title */}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {menu.path} {/* 💡 href -> path */}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 rounded-[1.5rem] bg-slate-100 py-5 font-black text-slate-500 hover:bg-slate-200 text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] rounded-[1.5rem] bg-[#020617] py-5 font-black text-white shadow-2xl hover:bg-blue-600 transition-all text-xs uppercase tracking-widest">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}