"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  RotateCw, TrendingUp, Mic, BriefcaseBusiness, UserX, Users, 
  Coins, CalendarDays, HelpCircle 
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const ago = new Date();
    ago.setMonth(today.getMonth() - 1);
    return { from: ago.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard?from=${dateRange.from}&to=${dateRange.to}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  }, [dateRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (isLoading || !data) return (
    <div className="flex h-[80vh] items-center justify-center bg-slate-50">
      <RotateCw className="h-10 w-10 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans antialiased tracking-tight text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-8">
        
        {/* 1. 헤더 - 폰트 위계 강조 */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 lg:text-5xl">
              실적 대시보드
            </h1>
            <p className="text-slate-500 font-semibold text-sm tracking-[0.15em] uppercase opacity-80">
              Business Performance Analytics
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-100">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 tabular-nums">
                <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="bg-transparent outline-none cursor-pointer" />
                <span className="text-slate-300 font-medium">~</span>
                <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="bg-transparent outline-none cursor-pointer" />
              </div>
            </div>
            <button onClick={fetchStats} className="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 transition-all duration-300 flex items-center gap-2 shadow-sm">
              <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              조회
            </button>
          </div>
        </header>

        {/* 2. 요약 카드 - 수치 가독성 상향 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "전체 접수", value: data.summary.total, unit: "건", color: "bg-blue-600" },
            { label: "매출 합계", value: data.summary.totalCommission.toLocaleString(), unit: "원", color: "bg-emerald-600" },
            { label: "TM 미배정", value: data.summary.unassignedTM, unit: "건", color: "bg-rose-500" },
            { label: "영업 미배정", value: data.summary.unassignedSales, unit: "건", color: "bg-orange-500" },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 left-0 h-full w-1.5 ${item.color}`} />
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{item.label}</p>
              <p className="text-3xl font-black text-slate-900 tabular-nums">
                {item.value}
                <span className="text-sm font-bold text-slate-400 ml-1.5 tracking-normal opacity-70">{item.unit}</span>
              </p>
            </div>
          ))}
        </section>

        {/* 3. 상담사 현황 (TM) */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shadow-inner">
              <Mic className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">상담사별 업무 현황</h2>
          </div>
          
          {data.tmList.map((tm: any, i: number) => (
            <div key={i} className="bg-white rounded-[32px] border border-slate-200/70 p-6 flex flex-col xl:flex-row items-center gap-8 shadow-sm hover:border-indigo-200 transition-all group">
              <div className="w-full xl:w-52 shrink-0 flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-base group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors tabular-nums shadow-sm">
                  {String(i+1).padStart(2, '0')}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-xl text-slate-900">{tm.name}</p>
                  <p className="text-[12px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md inline-block">
                    배정 {tm.total}건
                  </p>
                </div>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-3 md:grid-cols-6 gap-3">
                {data.headers.consult.map((h: string) => {
                  const count = tm.statusCounts[h] || 0;
                  const isPending = h === "미지정";
                  return (
                    <div key={h} className={`rounded-2xl p-4 border transition-all duration-300 ${count > 0 ? (isPending ? 'bg-amber-50/60 border-amber-200 shadow-sm' : 'bg-indigo-50/60 border-indigo-100 shadow-sm') : 'bg-slate-50/40 border-slate-100/50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className={`text-[11px] font-extrabold ${count > 0 ? (isPending ? 'text-amber-700' : 'text-indigo-700') : 'text-slate-500'}`}>{h}</p>
                        {isPending && count > 0 && <HelpCircle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                      </div>
                      <p className={`text-2xl font-black tabular-nums leading-none ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 4. 영업사원 현황 (Sales) */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center shadow-inner">
              <BriefcaseBusiness className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">영업사원별 실적 그리드</h2>
          </div>

          {data.salesList.map((sales: any, i: number) => (
            <div key={i} className="bg-white rounded-[32px] border border-slate-200/70 p-7 flex flex-col xl:flex-row gap-8 shadow-sm hover:border-emerald-200 transition-all group">
              <div className="xl:w-64 shrink-0 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-[22px] bg-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-200/50 group-hover:scale-105 transition-transform">
                    {sales.name[0]}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-2xl text-slate-900 tracking-tight">{sales.name}</p>
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">매출 ₩{sales.commission.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex justify-between items-center shadow-inner">
                  <span className="text-[12px] font-bold text-slate-500">전체 배정</span>
                  <span className="font-black text-slate-900 text-base tabular-nums">{sales.total}<span className="text-xs font-bold ml-0.5 text-slate-400">건</span></span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {data.headers.sales.map((h: string) => {
                  const count = sales.statusCounts[h] || 0;
                  const isPending = h === "미지정";
                  return (
                    <div key={h} className={`rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-center ${count > 0 ? (isPending ? 'bg-amber-50/60 border-amber-200 shadow-sm' : 'bg-emerald-50/60 border-emerald-100 shadow-sm') : 'bg-slate-50/40 border-slate-100/50'}`}>
                      <p className={`text-[11px] font-extrabold mb-2 leading-tight ${count > 0 ? (isPending ? 'text-amber-700' : 'text-emerald-700') : 'text-slate-500'}`}>{h}</p>
                      <p className={`text-2xl font-black tabular-nums leading-none ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}