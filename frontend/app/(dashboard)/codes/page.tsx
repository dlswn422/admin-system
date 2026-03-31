"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, RotateCw, Settings2, Trash2, Database, 
  CheckCircle2, X, ChevronRight, Save, Hash, Layers,
  LayoutGrid, Activity, Terminal
} from "lucide-react";

interface CodeGroup {
  id: string;
  group_code: string;
  group_name: string;
}

interface CodeDetail {
  id: string;
  group_id: string;
  code_value: string;
  code_name: string;
  sort_order: number;
  is_use: boolean;
}

export default function CodesPage() {
  const [groups, setGroups] = useState<CodeGroup[]>([]);
  const [details, setDetails] = useState<CodeDetail[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [groupForm, setGroupForm] = useState({ group_code: "", group_name: "" });
  const [detailForm, setDetailForm] = useState({ code_value: "", code_name: "", sort_order: 1, is_use: true });

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/codes/groups");
      const data = await res.json();
      setGroups(data || []);
      if (data?.length > 0 && !selectedGroupId) setSelectedGroupId(data[0].id);
    } finally { setIsLoading(false); }
  }, [selectedGroupId]);

  const fetchDetails = useCallback(async (groupId: string) => {
    const res = await fetch(`/api/codes/details?group_id=${groupId}`);
    const data = await res.json();
    setDetails(data || []);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { if (selectedGroupId) fetchDetails(selectedGroupId); }, [selectedGroupId, fetchDetails]);

  const handleGroupSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/codes/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupForm),
    });
    if (res.ok) {
      setIsGroupModalOpen(false);
      setGroupForm({ group_code: "", group_name: "" });
      fetchGroups();
    }
  };

  const handleDetailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/codes/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...detailForm, group_id: selectedGroupId }),
    });
    if (res.ok) {
      setIsDetailModalOpen(false);
      setDetailForm({ code_value: "", code_name: "", sort_order: details.length + 1, is_use: true });
      if (selectedGroupId) fetchDetails(selectedGroupId);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-8 font-sans bg-[#fcfcfd]">
      
      {/* --- 헤더 섹션 --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-lg shadow-slate-200">
            <Database className="w-3 h-3" /> System Dictionary
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none italic font-serif">코드 관리</h1>
          <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm">
            영업/상담 프로세스의 핵심 단계를 정의하고 시스템 마스터 데이터를 중앙 제어합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchGroups} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-xl transition-all flex items-center justify-center active:scale-95 shadow-sm">
            <RotateCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        
        {/* --- 좌측: 코드 그룹 (글래스모피즘 카드 리스트) --- */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 rounded-full bg-blue-600" />
              <h3 className="text-2xl font-black text-slate-900 uppercase italic font-serif">Master Group</h3>
            </div>
            <button onClick={() => setIsGroupModalOpen(true)} className="group h-12 w-12 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 transition-all flex items-center justify-center shadow-xl active:scale-90">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          
          <div className="grid gap-4">
            {groups.map((group) => (
              <div 
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`group cursor-pointer relative p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                  selectedGroupId === group.id 
                  ? "bg-slate-900 border-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] scale-[1.03]" 
                  : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block ${selectedGroupId === group.id ? "bg-blue-500/20 text-blue-400" : "bg-slate-50 text-slate-400"}`}>
                      {group.group_code}
                    </p>
                    <h4 className={`text-2xl font-black tracking-tight ${selectedGroupId === group.id ? "text-white" : "text-slate-900"}`}>
                      {group.group_name}
                    </h4>
                  </div>
                  {selectedGroupId === group.id && (
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                      <ChevronRight className="text-white w-6 h-6" />
                    </div>
                  )}
                </div>
                {/* 배경 패턴 */}
                <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full transition-colors ${selectedGroupId === group.id ? "bg-blue-500/10" : "bg-slate-50"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* --- 우측: 세부 코드 (네온 테이블 리스트) --- */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 rounded-full bg-emerald-500" />
              <h3 className="text-2xl font-black text-slate-900 uppercase italic font-serif">Attributes</h3>
            </div>
            <button 
              disabled={!selectedGroupId}
              onClick={() => setIsDetailModalOpen(true)} 
              className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-20"
            >
              <Plus className="w-5 h-5" /> New Variable
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-[3.5rem] p-4 shadow-xl overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-10 py-6">Prio</th>
                    <th className="px-6 py-6">Unique Key</th>
                    <th className="px-6 py-6">Label Name</th>
                    <th className="px-6 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {details.length > 0 ? (
                    details.map((detail) => (
                      <tr key={detail.id} className="group hover:bg-slate-50 transition-all">
                        <td className="px-10 py-7 rounded-l-[2rem] bg-slate-50/50 group-hover:bg-white transition-colors">
                           <span className="text-xl font-black italic font-serif text-slate-300 group-hover:text-blue-600">
                             {detail.sort_order.toString().padStart(2, '0')}
                           </span>
                        </td>
                        <td className="px-6 py-7 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50 group-hover:bg-white">
                          <span className="px-3 py-1 rounded-lg bg-white border border-slate-100">{detail.code_value}</span>
                        </td>
                        <td className="px-6 py-7 font-bold text-slate-600 bg-slate-50/50 group-hover:bg-white">{detail.code_name}</td>
                        <td className="px-6 py-7 text-center bg-slate-50/50 group-hover:bg-white">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${detail.is_use ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${detail.is_use ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {detail.is_use ? 'Active' : 'Locked'}
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right rounded-r-[2rem] bg-slate-50/50 group-hover:bg-white">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="h-10 w-10 rounded-xl hover:bg-slate-900 hover:text-white text-slate-300 transition-all flex items-center justify-center border border-transparent hover:shadow-lg"><Settings2 className="w-4 h-4" /></button>
                            <button className="h-10 w-10 rounded-xl hover:bg-rose-600 hover:text-white text-slate-300 transition-all flex items-center justify-center border border-transparent hover:shadow-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <Terminal className="w-16 h-16" />
                          <p className="text-xs font-black uppercase tracking-widest italic">Awaiting Module Selection</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- 모달 (프리미엄 블러 스타일) --- */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 relative">
            <button onClick={() => setIsGroupModalOpen(false)} className="absolute top-10 right-10 h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">New Master Group</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Dictionary Core Initialization</p>
            </div>
            <form onSubmit={handleGroupSave} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Group Identity Key</label>
                <input type="text" required value={groupForm.group_code} onChange={e => setGroupForm({...groupForm, group_code: e.target.value.toUpperCase()})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-black text-blue-600 uppercase focus:ring-4 ring-blue-500/5 outline-none transition-all" placeholder="SALES_TYPE" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Semantic Label</label>
                <input type="text" required value={groupForm.group_name} onChange={e => setGroupForm({...groupForm, group_name: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold text-slate-900 focus:ring-4 ring-blue-500/5 outline-none transition-all" placeholder="영업 채널 상태 관리" />
              </div>
              <button type="submit" className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all mt-8 active:scale-95">Deploy Commitment</button>
            </form>
          </div>
        </div>
      )}

      {/* --- 세부 코드 등록 모달 --- */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 relative">
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-10 right-10 h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">New Attribute</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Variable Entity Registration</p>
            </div>
            <form onSubmit={handleDetailSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Value ID</label>
                  <input type="text" required value={detailForm.code_value} onChange={e => setDetailForm({...detailForm, code_value: e.target.value.toUpperCase()})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-sm font-black text-blue-600 uppercase focus:ring-4 ring-blue-500/5 outline-none transition-all" placeholder="WAIT" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Public Label</label>
                  <input type="text" required value={detailForm.code_name} onChange={e => setDetailForm({...detailForm, code_name: e.target.value})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-sm font-bold text-slate-900 focus:ring-4 ring-violet-500/5 outline-none transition-all" placeholder="대기중" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Sequence Priority</label>
                <input type="number" required value={detailForm.sort_order} onChange={e => setDetailForm({...detailForm, sort_order: Number(e.target.value)})} className="w-full h-18 px-10 rounded-[2rem] bg-slate-50 border-none text-base font-bold text-slate-900 outline-none focus:ring-4 ring-blue-500/5 transition-all" />
              </div>
              <button type="submit" className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all mt-8 active:scale-95">Commit Variable</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}