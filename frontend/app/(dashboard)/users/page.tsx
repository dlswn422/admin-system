"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  UserPlus, 
  Search, 
  RotateCw, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Key, 
  Mail, 
  Phone, 
  ChevronDown, 
  Filter, 
  Trash2, 
  Edit3,
  CheckCircle2,
  Lock
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
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

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

  // 토스트 알림
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

  // 검색 및 역할 필터링 로직
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = 
        selectedRoleFilter === "all" || user.role_name === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedUser;
    if (isEdit && (!selectedUser?.id || selectedUser.id === "undefined")) {
      showToast("사용자 식별 ID가 유효하지 않습니다.", "error");
      return;
    }

    try {
      const res = await fetch(isEdit ? `/api/users/${selectedUser.id}` : "/api/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEdit ? "정보가 성공적으로 수정되었습니다." : "새 사용자가 등록되었습니다.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "처리 중 오류가 발생했습니다.", "error");
      }
    } catch (error) {
      showToast("네트워크 연결 상태를 확인해주세요.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || id === "undefined") return;
    if (!confirm("해당 계정을 영구적으로 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("데이터베이스에서 삭제되었습니다.");
        fetchData();
      }
    } catch (error) {
      showToast("삭제 중 에러가 발생했습니다.", "error");
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
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* --- 상단 토스트 알림 --- */}
      {toast && (
        <div className={`fixed top-10 right-10 z-[11000] flex items-center gap-3 rounded-3xl px-8 py-5 shadow-2xl border border-white/20 backdrop-blur-2xl animate-in slide-in-from-right-10 duration-500 ${
          toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          <p className="font-bold tracking-tight text-sm">{toast.message}</p>
        </div>
      )}

      {/* --- 헤더 섹션 --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
            User Management System
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">사용자 관리</h1>
          <p className="text-slate-400 font-medium max-w-md leading-relaxed">
            시스템에 접속 가능한 모든 구성원을 관리하고 권한을 부여합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="flex items-center justify-center h-16 w-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all active:scale-95 group"
          >
            <RotateCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-3 rounded-3xl bg-blue-600 px-8 py-5 text-sm font-black text-white hover:bg-slate-900 shadow-2xl shadow-blue-200 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>신규 계정 생성</span>
          </button>
        </div>
      </div>

      {/* --- 통계 요약 카드 --- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "전체 사용자", value: users.length, icon: Users, color: "blue" },
          { label: "활성 상태", value: users.filter(u => u.is_active).length, icon: UserCheck, color: "emerald" },
          { label: "관리자 그룹", value: users.filter(u => u.role_name === "관리자").length, icon: ShieldCheck, color: "indigo" },
          { label: "등록된 역할", value: roles.length, icon: Key, color: "orange" },
        ].map((stat, i) => (
          <div key={i} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="mt-6">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* --- 통합 컨트롤러 --- */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="이름 또는 이메일로 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[1.5rem] border-none bg-slate-100/50 pl-16 pr-6 py-5 text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 transition-all text-slate-900" 
          />
        </div>

        <div className="relative md:w-64 group">
          <Filter className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <select 
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full appearance-none rounded-[1.5rem] border-none bg-slate-100/50 pl-16 pr-12 py-5 text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 cursor-pointer text-slate-900"
          >
            <option value="all">모든 역할 레벨</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-5.5 w-4 h-4 text-slate-300 pointer-events-none" />
        </div>
      </div>

      {/* --- 데이터 테이블 --- */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">사용자 정보</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">연락처</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">역할 권한</th>
                <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">계정 상태</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-32 text-center text-slate-300 animate-pulse font-black tracking-widest uppercase text-xs">데이터를 동기화 중입니다...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-slate-400 font-bold">검색 결과에 맞는 사용자가 없습니다.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-white flex items-center justify-center font-black text-slate-400 shadow-inner group-hover:from-blue-600 group-hover:to-blue-400 group-hover:text-white transition-all duration-500">
                          {user.name[0]}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="font-black text-slate-900 tracking-tight text-base">{user.name}</span>
                          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600 tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-slate-300" /> {user.phone || "비공개"}
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider group-hover:border-blue-200 group-hover:text-blue-600 transition-colors ${getRoleBadge(user.role_name)}`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {user.is_active ? "활성화" : "잠금"}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => openModal(user)} className="p-3 rounded-xl hover:bg-slate-900 hover:text-white text-slate-400 transition-all shadow-sm">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-3 rounded-xl hover:bg-rose-600 hover:text-white text-slate-400 transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 프리미엄 모달 --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-12 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {selectedUser ? "정보 수정" : "새 계정 생성"}
              </h2>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Security & Profile Configuration</p>
            </div>

            <form onSubmit={handleSave} className="space-y-7">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">사용자 성함</label>
                  <input type="text" required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">비상 연락처</label>
                  <input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="w-full rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">이메일 계정</label>
                  <input type="email" required value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="w-full rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">액세스 비밀번호</label>
                  <input type="password" required={!selectedUser} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} className="w-full rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all" placeholder={selectedUser ? "변경 시에만 입력" : "비밀번호 설정"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1 tracking-widest">권한 레벨</label>
                  <div className="relative">
                    <select value={formData.role_id} onChange={(e)=>setFormData({...formData, role_id: e.target.value})} className="w-full appearance-none rounded-2xl bg-slate-50 border-none px-6 py-5 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all cursor-pointer">
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-5.5 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div 
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.is_active ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-tight">계정 상태 활성화</span>
                  {formData.is_active ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 py-6 bg-slate-100 rounded-[2rem] text-slate-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">취소</button>
                <button type="submit" className="flex-[2] py-6 bg-slate-900 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 shadow-2xl shadow-slate-300 transition-all active:scale-95">정보 저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}