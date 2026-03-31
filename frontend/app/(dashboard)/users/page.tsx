"use client";

import { useEffect, useState, useCallback } from "react";

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    role_id: "", 
    password: "", 
    is_active: true 
  });

  // 세련된 토스트 알림 함수
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 데이터 로드
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles")
      ]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      
      setUsers(uData);
      setRoles(rData);
      
      // 초기 등록 폼 역할 설정
      if (rData.length > 0 && !formData.role_id) {
        setFormData(prev => ({ ...prev, role_id: rData[0].id }));
      }
    } catch (error) {
      showToast("데이터를 동기화하는 중 문제가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 모달 열기/닫기
  const openModal = (user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        role_id: user.role_id, 
        password: "", 
        is_active: user.is_active 
      });
    } else {
      setSelectedUser(null);
      setFormData({ 
        name: "", 
        email: "", 
        phone: "", 
        role_id: roles.length > 0 ? roles[0].id : "", 
        password: "", 
        is_active: true 
      });
    }
    setIsModalOpen(true);
  };

  // 저장 (POST / PATCH)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedUser;
    
    // 💡 방어 로직: 수정 시 ID가 없으면 중단
    if (isEdit && (!selectedUser?.id || selectedUser.id === "undefined")) {
      showToast("사용자 식별 ID(UUID)가 유효하지 않습니다.", "error");
      return;
    }

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `/api/users/${selectedUser.id}` : "/api/users";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEdit ? "계정 정보가 업데이트되었습니다." : "새 계정이 성공적으로 생성되었습니다.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "요청을 처리할 수 없습니다.", "error");
      }
    } catch (error) {
      showToast("네트워크 연결 상태를 확인해주세요.", "error");
    }
  };

  // 삭제 (DELETE)
  const handleDelete = async (id: string) => {
    // 💡 방어 로직: ID가 undefined이면 API 호출 자체를 막음
    if (!id || id === "undefined") {
      showToast("삭제할 사용자의 유효한 ID를 찾을 수 없습니다.", "error");
      return;
    }

    if (!confirm("해당 계정을 영구적으로 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("계정이 데이터베이스에서 삭제되었습니다.");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "삭제 권한이 없거나 오류가 발생했습니다.", "error");
      }
    } catch (error) {
      showToast("서버 통신 중 에러가 발생했습니다.", "error");
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: any = {
      "관리자": "bg-indigo-50 text-indigo-600 border-indigo-100",
      "영업": "bg-amber-50 text-amber-600 border-amber-100",
      "상담": "bg-cyan-50 text-cyan-600 border-cyan-100",
    };
    return styles[role] || "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- 세련된 토스트 알림 --- */}
      {toast && (
        <div className={`fixed top-8 right-8 z-[11000] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right-10 duration-500 border border-white/20 backdrop-blur-md ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <span className="text-lg">{toast.type === "success" ? "✨" : "🚫"}</span>
          <p className="text-sm font-black tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* --- 통계 요약 --- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: users.length, icon: "👥", bg: "from-blue-500 to-blue-600" },
          { label: "Active Staff", value: users.filter(u => u.is_active).length, icon: "🟢", bg: "from-emerald-500 to-teal-600" },
          { label: "Admin Root", value: users.filter(u => u.role_name === "관리자").length, icon: "🛡️", bg: "from-indigo-500 to-purple-600" },
          { label: "Defined Roles", value: roles.length, icon: "🔑", bg: "from-orange-500 to-rose-600" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-7 shadow-sm transition-all hover:shadow-xl">
            <div className="flex items-center justify-between relative z-10">
              <span className="text-3xl filter drop-shadow-md">{stat.icon}</span>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">{stat.label}</p>
            </div>
            <p className="mt-4 text-4xl font-black text-slate-900 relative z-10 tracking-tighter">{stat.value}</p>
            <div className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.bg} opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500`} />
          </div>
        ))}
      </div>

      {/* --- 상단 액션 바 --- */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2.5rem] border border-white bg-white/60 p-5 backdrop-blur-xl shadow-sm">
        <div className="flex flex-1 items-center gap-4 min-w-[320px]">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              placeholder="Search users identity..." 
              className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-6 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white shadow-inner text-slate-900" 
            />
            <span className="absolute left-5 top-4.5 text-slate-400 group-focus-within:text-blue-500">🔍</span>
          </div>
          <button onClick={fetchData} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">🔄</button>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-3 rounded-2xl bg-[#020617] px-10 py-4 text-sm font-black text-white hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          <span>+</span> <span className="tracking-widest">REGISTER USER</span>
        </button>
      </div>

      {/* --- 사용자 테이블 --- */}
      <div className="overflow-hidden rounded-[3rem] border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Contact</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Role</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Status</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={5} className="py-32 text-center text-slate-400 animate-pulse font-black tracking-widest text-xs uppercase">Connecting to Database...</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="group hover:bg-blue-50/40 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tighter text-base">{user.name}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm font-black text-slate-600 tracking-tighter tabular-nums">{user.phone || "-"}</td>
                  <td className="px-6 py-6 text-xs font-black">
                    <span className={`inline-block rounded-xl border px-3.5 py-1.5 uppercase tracking-wider ${getRoleBadge(user.role_name)}`}>
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase ${user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {user.is_active ? "Verified" : "Locked"}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => openModal(user)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm">EDIT</button>
                      <button onClick={() => handleDelete(user.id)} className="rounded-xl border border-rose-100 bg-white px-5 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm">DEL</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- 등록/수정 모달 --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[3rem] border border-white/20 bg-white p-12 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="mb-10 text-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedUser ? "Modify Account" : "Access Creation"}</h3>
              <p className="mt-2 text-sm text-slate-400 font-bold uppercase tracking-widest">Security & Profile Settings</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Full Name</label>
                  <input type="text" required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Contact Phone</label>
                  <input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email Identity</label>
                  <input type="email" required value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                  <input type="password" required={!selectedUser} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" placeholder={selectedUser ? "변경 시에만 입력" : "비밀번호 설정"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Role Authority</label>
                  <div className="relative">
                    <select value={formData.role_id} onChange={(e)=>setFormData({...formData, role_id: e.target.value})} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-blue-500 text-slate-900">
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    <span className="absolute right-6 top-4.5 pointer-events-none text-slate-400">▼</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">Security Status</label>
                  <label className="flex items-center h-[56px] px-6 gap-3 rounded-[1.25rem] bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={formData.is_active} onChange={(e)=>setFormData({...formData, is_active: e.target.checked})} className="h-5 w-5 accent-blue-600 rounded-md" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Activate Account</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 pt-10">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 rounded-[1.5rem] bg-slate-100 py-5 font-black text-slate-500 hover:bg-slate-200 transition-all tracking-widest text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-[2] rounded-[1.5rem] bg-[#020617] py-5 font-black text-white shadow-2xl hover:bg-blue-600 transition-all tracking-widest text-xs uppercase">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}