"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, RotateCw, Settings2, Trash2, Database, 
  CheckCircle2, X, ChevronRight, Save, Hash, Layers
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

  // 1. 코드 그룹(마스터) 목록 불러오기
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/codes/groups");
      if (!res.ok) throw new Error("그룹 데이터를 가져오는데 실패했습니다.");
      const data = await res.json();
      setGroups(data || []);
      
      // 데이터가 있으면 첫 번째 그룹을 자동으로 선택
      if (data?.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  // 2. 선택된 그룹의 상세 코드 목록 불러오기
  const fetchDetails = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/codes/details?group_id=${groupId}`);
      if (!res.ok) throw new Error("상세 코드를 가져오는데 실패했습니다.");
      const data = await res.json();
      setDetails(data || []);
    } catch (error) {
      console.error("Detail Fetch Error:", error);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { if (selectedGroupId) fetchDetails(selectedGroupId); }, [selectedGroupId, fetchDetails]);

  // 그룹 저장
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

  // 상세 코드 저장
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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 px-6 font-sans">
      
      {/* --- 상단 헤더 --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
            시스템 데이터 사전
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight italic font-serif">코드 관리</h1>
          <p className="text-slate-400 font-medium max-w-md leading-relaxed text-sm">
            영업 상태, 상담 결과 등 시스템 전반에서 공통으로 사용하는 마스터 코드를 체계적으로 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchGroups} className="h-16 w-16 rounded-3xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center active:scale-95">
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* --- 좌측: 코드 그룹 리스트 --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase italic font-serif tracking-tighter">코드 마스터 그룹</h3>
            <button onClick={() => setIsGroupModalOpen(true)} className="p-2 rounded-xl bg-slate-900 text-white hover:bg-blue-600 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-10 text-slate-300 animate-pulse">그룹을 불러오는 중...</div>
            ) : groups.map((group) => (
              <div 
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`group cursor-pointer p-6 rounded-[2.5rem] border transition-all duration-500 ${
                  selectedGroupId === group.id 
                  ? "bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]" 
                  : "bg-white border-slate-100 hover:border-blue-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedGroupId === group.id ? "text-blue-400" : "text-slate-400"}`}>
                      {group.group_code}
                    </p>
                    <h4 className={`text-xl font-black ${selectedGroupId === group.id ? "text-white" : "text-slate-900"}`}>
                      {group.group_name}
                    </h4>
                  </div>
                  {selectedGroupId === group.id && <ChevronRight className="text-white w-6 h-6 animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 우측: 세부 코드 테이블 --- */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase italic font-serif tracking-tighter">상세 코드 속성</h3>
            <button 
              disabled={!selectedGroupId}
              onClick={() => setIsDetailModalOpen(true)} 
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all disabled:opacity-20"
            >
              <Plus className="w-4 h-4" /> 새 코드 추가
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-10 py-7">순서</th>
                  <th className="px-6 py-7">코드값(Key)</th>
                  <th className="px-6 py-7">표시 이름</th>
                  <th className="px-6 py-7 text-center">상태</th>
                  <th className="px-10 py-7 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-sm">
                {details.length > 0 ? (
                  details.map((detail) => (
                    <tr key={detail.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6 text-slate-400 font-mono italic">{detail.sort_order}</td>
                      <td className="px-6 py-6 font-black text-blue-600 uppercase">{detail.code_value}</td>
                      <td className="px-6 py-6 text-slate-900">{detail.code_name}</td>
                      <td className="px-6 py-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase ${detail.is_use ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {detail.is_use ? '사용중' : '숨김'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right space-x-2">
                        <button className="p-3 rounded-xl hover:bg-slate-900 hover:text-white text-slate-300 transition-all"><Settings2 className="w-4 h-4" /></button>
                        <button className="p-3 rounded-xl hover:bg-rose-600 hover:text-white text-slate-300 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">
                      그룹을 선택하거나 상세 코드를 추가해주세요
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- 그룹 등록 모달 --- */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/20 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[4rem] p-16 shadow-2xl animate-in zoom-in-95 duration-500 relative">
            <button onClick={() => setIsGroupModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button>
            <div className="mb-12 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">새 마스터 그룹</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">시스템 코드 아키텍처 초기화</p>
            </div>
            <form onSubmit={handleGroupSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">고유 그룹 코드(ID)</label>
                <input type="text" required value={groupForm.group_code} onChange={e => setGroupForm({...groupForm, group_code: e.target.value.toUpperCase()})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-black text-blue-600 uppercase outline-none focus:ring-4 ring-blue-500/10" placeholder="예: STATUS_TYPE" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">그룹 설명 이름</label>
                <input type="text" required value={groupForm.group_name} onChange={e => setGroupForm({...groupForm, group_name: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-500/10" placeholder="예: 상담 상태 코드 관리" />
              </div>
              <button type="submit" className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all mt-6">그룹 생성 확정</button>
            </form>
          </div>
        </div>
      )}

      {/* --- 상세 코드 등록 모달 --- */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/20 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[4rem] p-16 shadow-2xl animate-in zoom-in-95 duration-500 relative">
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button>
            <div className="mb-12 text-center">
              <h3 className="text-4xl font-black text-slate-900 italic font-serif uppercase tracking-tighter">새 상세 코드 추가</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">시스템 메타데이터 등록</p>
            </div>
            <form onSubmit={handleDetailSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">코드 값(Key)</label>
                  <input type="text" required value={detailForm.code_value} onChange={e => setDetailForm({...detailForm, code_value: e.target.value.toUpperCase()})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-black text-blue-600 uppercase outline-none focus:ring-4 ring-blue-500/10" placeholder="WAIT" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">표시 이름(Label)</label>
                  <input type="text" required value={detailForm.code_name} onChange={e => setDetailForm({...detailForm, code_name: e.target.value})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-500/10" placeholder="대기중" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">정렬 순서</label>
                <input type="number" required value={detailForm.sort_order} onChange={e => setDetailForm({...detailForm, sort_order: Number(e.target.value)})} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-none text-base font-bold outline-none focus:ring-4 ring-blue-500/10" />
              </div>
              <button type="submit" className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all mt-6">상세 코드 등록</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}