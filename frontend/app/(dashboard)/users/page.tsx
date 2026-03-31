"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  UserPlus, Search, RotateCw, ShieldCheck, UserCheck, 
  Users, Key, Mail, Phone, ChevronDown, Filter, 
  Trash2, Edit3, CheckCircle2, Lock, X, Fingerprint,
  MoreHorizontal, Smartphone, ShieldAlert
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", email: "", phone: "", role_id: "", password: "", is_active: true 
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([fetch("/api/users"), fetch("/api/roles")]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
      setRoles(Array.isArray(rData) ? rData : []);
      if (rData.length > 0 && !formData.role_id) setFormData(prev => ({ ...prev, role_id: rData[0].id }));
    } catch (error) {
      showToast("데이터 동기화 실패", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRoleFilter === "all" || user.role_name === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const openModal = (user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({ name: user.name, email: user.email, phone: user.phone, role_id: user.role_id, password: "", is_active: user.is_active });
    } else {
      setSelectedUser(null);
      setFormData({ name: "", email: "", phone: "", role_id: roles.length > 0 ? roles[0].id : "", password: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedUser;
    try {
      const res = await fetch(isEdit ? `/api/users/${selectedUser?.id}` : "/api/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast(isEdit ? "사용자 정보가 갱신되었습니다." : "새 계정이 생성되었습니다.");
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) { showToast("네트워크 통신 오류", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("해당 계정을 영구 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("삭제 완료"); fetchData(); }
    } catch (error) { showToast("삭제 실패", "error"); }
  };

  // 💡 권한별 프리미엄 뱃지 스타일 정의
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "관리자":
        return "bg-slate-900 text-white shadow-lg shadow-slate-200 border-slate-900";
      case "영업":
        return "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50";
      case "상담":
        return "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50";
      default:
        return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-8 font-sans bg-[#fcfcfd]">
      
      {/* --- 상단 토스트 --- */}
      {toast && (
        <div className={`fixed top-10 right-10 z-[11000] flex items-center gap-3 rounded-3xl px-8 py-5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-in slide-in-from-right-10 duration-500 ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="font-bold tracking-tight text-sm uppercase">{toast.message}</p>
        </div>
      )}

      {/* --- 헤더 --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-lg shadow-slate-200">
            <Users className="w-3 h-3" /> Identity Management
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none italic font-serif">사용자 관리</h1>
          <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm">
            시스템 권한 그룹별 구성원을 관리하고 보안 아키텍처를 구성합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center active:scale-95 shadow-sm">
            <RotateCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-2xl shadow-blue-200 transition-all active:scale-95">
            <UserPlus className="w-5 h-5" /> New Account
          </button>
        </div>
      </div>

      {/* --- 필터 바 --- */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="사용자 이름 또는 이메일 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[1.5rem] border-none bg-slate-50/50 pl-16 pr-6 py-5 text-sm font-bold outline-none focus:ring-4 ring-blue-500/5 transition-all text-slate-900 placeholder:text-slate-400" 
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-6 top-5 w-5 h-5 text-slate-300" />
          <select 
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full appearance-none rounded-[1.5rem] border-none bg-slate-50/50 pl-16 pr-12 py-5 text-sm font-bold outline-none focus:ring-4 ring-blue-500/5 cursor-pointer text-slate-900"
          >
            <option value="all">모든 권한 그룹</option>
            {roles.map(role => ( <option key={role.id} value={role.name}>{role.name}</option> ))}
          </select>
          <ChevronDown className="absolute right-8 top-5.5 w-4 h-4 text-slate-300 pointer-events-none" />
        </div>
      </div>

      {/* --- 💡 프리미엄 테이블 목록 --- */}
      <div className="bg-white border border-slate-100 rounded-[3.5rem] p-4 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <th className="px-10 py-4">Identity</th>
                <th className="px-6 py-4">Authority</th>
                <th className="px-6 py-4 text-center">Security Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-10 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-40 text-center text-slate-300 animate-pulse font-black uppercase text-xs tracking-widest italic">Synchronizing Data...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:scale-[1.005] transition-all duration-300">
                  {/* 사용자 정보 */}
                  <td className="px-10 py-6 rounded-l-[2.5rem] bg-slate-50/50 group-hover:bg-white border-l border-t border-b border-transparent group-hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-inner flex items-center justify-center font-black text-slate-400 text-xl italic font-serif group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                        {user.name[0]}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors uppercase">{user.name}</p>
                        <p className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* 권한 뱃지 (💡 권한별 스타일 적용) */}
                  <td className="px-6 py-6 bg-slate-50/50 group-hover:bg-white border-t border-b border-transparent group-hover:border-slate-100">
                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${getRoleStyle(user.role_name)}`}>
                      {user.role_name}
                    </span>
                  </td>

                  {/* 보안 상태 */}
                  <td className="px-6 py-6 text-center bg-slate-50/50 group-hover:bg-white border-t border-b border-transparent group-hover:border-slate-100">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {user.is_active ? "Verified" : "Locked"}
                    </div>
                  </td>

                  {/* 생성일 */}
                  <td className="px-6 py-6 bg-slate-50/50 group-hover:bg-white border-t border-b border-transparent group-hover:border-slate-100">
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-400 font-mono italic">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* 액션 */}
                  <td className="px-10 py-6 rounded-r-[2.5rem] bg-slate-50/50 group-hover:bg-white border-r border-t border-b border-transparent group-hover:border-slate-100 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => openModal(user)} className="h-12 w-12 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:shadow-lg transition-all flex items-center justify-center active:scale-90">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="h-12 w-12 rounded-xl bg-white border border-rose-100 text-rose-300 hover:text-rose-600 hover:bg-rose-50 hover:shadow-lg transition-all flex items-center justify-center active:scale-90">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 모달 (기존 프리미엄 모달 유지) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 duration-500 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
            <div className="mb-14 text-center">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic font-serif leading-none">{selectedUser ? "Modify Identity" : "New Enrollment"}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Security & Profile Specification</p>
            </div>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">Personnel Name</label>
                  <input type="text" required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-600/5 transition-all text-slate-900" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">Contact Hash</label>
                  <input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-600/5 transition-all text-slate-900" placeholder="010-0000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">Email Identity</label>
                  <input type="email" required value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-600/5 transition-all text-slate-900" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">Access Key</label>
                  <input type="password" required={!selectedUser} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-600/5 transition-all text-slate-900" placeholder={selectedUser ? "No change if empty" : "********"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-4 tracking-widest">Authority Root</label>
                  <div className="relative">
                    <select value={formData.role_id} onChange={(e)=>setFormData({...formData, role_id: e.target.value})} className="w-full h-18 px-10 appearance-none rounded-[2rem] bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-600/5 transition-all cursor-pointer text-slate-900">
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div 
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                  className={`flex items-center justify-between h-18 px-8 rounded-[2rem] border-2 transition-all cursor-pointer ${formData.is_active ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-xl shadow-blue-50/50' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_active ? 'Account Verified' : 'Access Revoked'}</span>
                  {formData.is_active ? <CheckCircle2 className="w-5 h-5 animate-pulse" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>
              <div className="flex gap-4 pt-10">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 h-20 rounded-[2.5rem] font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-[11px] tracking-[0.2em]">Dismiss</button>
                <button type="submit" className="flex-[2] h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:bg-blue-600 transition-all active:scale-95">Commit Identity</button>
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