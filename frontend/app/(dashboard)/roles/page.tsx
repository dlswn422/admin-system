"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  ShieldCheck, 
  RotateCw, 
  Key, 
  LayoutGrid, 
  Search, 
  ChevronDown, 
  Filter, 
  Trash2, 
  Edit3, 
  Check, 
  Fingerprint,
  Plus
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
      const [rRes, mRes] = await Promise.all([fetch("/api/roles"), fetch("/api/menus")]);
      const rData = await rRes.json();
      const mData = await mRes.json();
      setRoles(rData);
      setAllMenus(mData);
    } catch (error) {
      showToast("데이터 동기화에 실패했습니다.", "error");
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
        setSelectedMenuIds(accessData.map((item: any) => item.menu_id));
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
        showToast(isEdit ? "권한 설정이 변경되었습니다." : "새 역할이 등록되었습니다.");
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showToast("처리 중 오류가 발생했습니다.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("역할이 데이터베이스에서 삭제되었습니다.");
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
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* --- 상단 토스트 알림 (동일 스타일) --- */}
      {toast && (
        <div className={`fixed top-10 right-10 z-[11000] flex items-center gap-3 rounded-3xl px-8 py-5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-in slide-in-from-right-10 ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="font-bold tracking-tight text-sm">{toast.message}</p>
        </div>
      )}

      {/* --- 헤더 섹션 (동일 스타일) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">
            Security & Authority Root
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">역할 관리</h1>
          <p className="text-slate-400 font-medium max-w-md leading-relaxed">
            조직 내 직무별 권한 그룹을 생성하고 메뉴 접근 범위를 정밀하게 제어합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="flex items-center justify-center h-16 w-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:shadow-xl transition-all group active:scale-95">
            <RotateCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-3 rounded-3xl bg-slate-900 px-8 py-5 text-sm font-black text-white hover:bg-violet-600 shadow-2xl shadow-slate-300 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span>신규 역할 추가</span>
          </button>
        </div>
      </div>

      {/* --- 통계 요약 카드 (동일 스타일) --- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "활성 역할 수", value: roles.length, icon: ShieldCheck, color: "violet" },
          { label: "연결된 메뉴", value: allMenus.length, icon: LayoutGrid, color: "blue" },
          { label: "시스템 마스터", value: roles.filter(r => r.name.includes("관리자")).length, icon: Key, color: "indigo" },
          { label: "최근 갱신일", value: "Today", icon: Fingerprint, color: "orange", isText: true },
        ].map((stat, i) => (
          <div key={i} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="mt-6">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">
                {stat.isText ? stat.value : stat.value.toString().padStart(2, '0')}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* --- 통합 컨트롤러 (동일 스타일) --- */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
          <input 
            type="text" 
            placeholder="역할 이름을 검색하세요..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[1.5rem] border-none bg-slate-100/50 pl-16 pr-6 py-5 text-sm font-bold outline-none focus:ring-2 ring-violet-500/10 transition-all text-slate-900" 
          />
        </div>
      </div>

      {/* --- 역할 데이터 리스트 (Premium Table) --- */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">역할 식별자</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">생성 일자</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">권한 수준</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">관리 옵션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="py-32 text-center text-slate-300 animate-pulse font-black tracking-widest uppercase text-xs">데이터 동기화 중...</td></tr>
              ) : filteredRoles.map((role) => (
                <tr key={role.id} className="group hover:bg-violet-50/30 transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-white flex items-center justify-center font-black text-slate-400 shadow-inner group-hover:from-violet-600 group-hover:to-violet-400 group-hover:text-white transition-all duration-500">
                        {role.name[0]}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-black text-slate-900 tracking-tight text-base">{role.name}</span>
                        <span className="text-[10px] font-medium text-slate-400 font-mono">{role.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 font-bold text-slate-600 text-sm tabular-nums">
                    {new Date(role.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className="px-4 py-1.5 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-wider group-hover:border-violet-200 group-hover:text-violet-600 transition-colors">
                      Custom Access Level
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => openModal(role)} className="p-3 rounded-xl hover:bg-slate-900 hover:text-white text-slate-400 transition-all shadow-sm">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedRole(role); setIsDeleteModalOpen(true); }} className="p-3 rounded-xl hover:bg-rose-600 hover:text-white text-slate-400 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 등록/수정 모달 (동일 스타일) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[3.5rem] p-12 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {selectedRole ? "역할 정보 수정" : "신규 역할 등록"}
              </h2>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Authority & Permission Mapping</p>
            </div>

            <form onSubmit={handleSave} className="space-y-7">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">역할 식별 이름</label>
                <input type="text" required value={formData.name} onChange={(e)=>setFormData({name: e.target.value})} className="w-full rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-violet-500/20 outline-none transition-all text-slate-900" />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">메뉴 접근 권한 설정</label>
                <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner max-h-64 overflow-y-auto">
                  {allMenus.map((menu) => (
                    <label key={menu.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedMenuIds.includes(menu.id) ? 'bg-white border-violet-200 text-violet-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/50'}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedMenuIds.includes(menu.id)}
                        onChange={() => toggleMenuSelection(menu.id)}
                        className="h-5 w-5 accent-violet-600 rounded-md cursor-pointer"
                      />
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-base">{menu.icon}</span>
                        <span className="text-xs font-black tracking-tight truncate">{menu.title}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 py-6 bg-slate-100 rounded-[2rem] text-slate-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">취소</button>
                <button type="submit" className="flex-[2] py-6 bg-slate-900 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-violet-600 shadow-2xl shadow-slate-300 transition-all active:scale-95">권한 저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 삭제 확인 모달 (동일 스타일) --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/80 backdrop-blur-lg p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 text-3xl animate-bounce">⚠️</div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">역할 삭제</h3>
            <p className="mt-3 text-sm font-bold text-slate-400 leading-relaxed">이 역할을 사용 중인 사용자가 있을 경우<br />삭제가 거부될 수 있습니다.</p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full rounded-2xl bg-rose-600 py-4 font-black text-white shadow-lg hover:bg-rose-700 transition-all active:scale-95 text-xs uppercase tracking-widest">네, 삭제합니다</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full rounded-2xl bg-slate-100 py-4 font-black text-slate-500 hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}