"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RotateCw,
  Trash2,
  CheckCircle2,
  X,
  Link2,
  Layers3,
  ListOrdered,
  FolderKanban,
  Settings2,
  ArrowUpRight,
  Sparkles,
  Navigation,
} from "lucide-react";

interface Menu {
  id: string;
  title: string;
  path: string;
  icon: string;
  sort_order: number;
}



export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    path: "",
    icon: "📁",
    sort_order: 1,
  });

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/menus?all=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenus(data.sort((a: Menu, b: Menu) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      console.error("데이터 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openModal = (menu: Menu | null = null) => {
    if (menu) {
      setSelectedMenu(menu);
      setFormData({
        title: menu.title,
        path: menu.path,
        icon: menu.icon,
        sort_order: menu.sort_order,
      });
    } else {
      setSelectedMenu(null);
      setFormData({
        title: "",
        path: "/",
        icon: "📁",
        sort_order: menus.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!selectedMenu;
    const url = isEdit ? `/api/menus/${selectedMenu.id}` : "/api/menus";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchMenus();
    }
  };

  const lastSortOrder = useMemo(() => {
    if (!menus.length) return 0;
    return Math.max(...menus.map((menu) => menu.sort_order));
  }, [menus]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      {/* 상단 히어로 */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,18,36,0.88))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.18)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,transparent_72%,rgba(59,130,246,0.06))]" />
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-blue-500/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200">
                <Layers3 className="h-3.5 w-3.5" />
                내비게이션 관리
              </div>

              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                메뉴 관리
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                사이드바에 노출되는 메뉴 구조와 경로, 아이콘, 정렬 순서를
                통합 관리합니다. 운영자가 빠르게 수정하고 배포할 수 있도록
                정돈된 관리 화면으로 구성했습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchMenus}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                aria-label="새로고침"
              >
                <RotateCw
                  className={`h-5 w-5 transition-transform duration-500 ${
                    isLoading ? "animate-spin" : "group-hover:rotate-180"
                  }`}
                />
              </button>

              <button
                onClick={() => openModal()}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 px-6 py-4 text-sm font-extrabold tracking-[-0.02em] text-white shadow-[0_18px_36px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(59,130,246,0.32)] active:scale-[0.98]"
              >
                <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.16)_20%,transparent_42%)] [animation:shimmer-x_2.8s_linear_infinite]" />
                <Plus className="relative z-10 h-4.5 w-4.5" />
                <span className="relative z-10">새 메뉴 추가</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 요약 카드 */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="fade-up group rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/95 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">전체 메뉴</p>
              <p className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                {menus.length.toString().padStart(2, "0")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/15">
              <Navigation className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">
            현재 등록된 전체 내비게이션 수
          </p>
        </div>

        <div className="fade-up group rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/95 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">마지막 순번</p>
              <p className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                {lastSortOrder.toString().padStart(2, "0")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/15">
              <ListOrdered className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">
            정렬 기준의 최종 우선순위
          </p>
        </div>

        <div className="fade-up group rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/95 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">운영 상태</p>
              <p className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                정상
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15">
              <CheckCircle2 className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">
            메뉴 구조 동기화 상태 양호
          </p>
        </div>
      </section>

      {/* 메뉴 레지스트리 */}
      <section className="fade-up overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
                메뉴 레지스트리
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                각 메뉴의 노출명, 경로, 정렬 순서, 아이콘 구성을 관리합니다.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              실시간 반영
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="hidden rounded-2xl bg-slate-50 px-5 py-3 text-[11px] font-bold tracking-[0.12em] text-slate-400 md:grid md:grid-cols-[120px_minmax(0,1fr)_120px_220px] md:items-center md:gap-4">
            <span>아이콘</span>
            <span>메뉴 정보</span>
            <span>정렬 순서</span>
            <span className="text-right">작업</span>
          </div>

          <div className="mt-3 space-y-3">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-[24px] border border-slate-100 bg-slate-50/80 animate-pulse"
                />
              ))
            ) : menus.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-800">
                  등록된 메뉴가 없습니다
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  새 메뉴를 추가해 내비게이션 구조를 구성하세요.
                </p>
                <button
                  onClick={() => openModal()}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  새 메뉴 추가
                </button>
              </div>
            ) : (
              menus.map((menu, index) => (
                <div
                  key={menu.id}
                  className="group rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_120px_220px] md:items-center">
                    {/* 아이콘 */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-100 text-3xl shadow-inner transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                        {menu.icon}
                      </div>
                      <div className="md:hidden">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400">
                          순번
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {menu.sort_order.toString().padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    {/* 메뉴 정보 */}
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3 md:block">
                        <div className="min-w-0">
                          <h3 className="truncate text-[1.2rem] font-black tracking-[-0.04em] text-slate-900 transition-colors group-hover:text-blue-600">
                            {menu.title}
                          </h3>

                          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                            <Link2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{menu.path}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 순서 */}
                    <div className="hidden md:flex md:justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black tracking-[-0.03em] text-slate-700">
                        <ListOrdered className="h-4 w-4 text-slate-400" />
                        {menu.sort_order.toString().padStart(2, "0")}
                      </div>
                    </div>

                    {/* 작업 */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(menu)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                      >
                        <Settings2 className="h-4 w-4" />
                        <span>수정</span>
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                        aria-label={`${menu.title} 삭제`}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_40px_90px_rgba(15,23,42,0.25)] animate-in zoom-in-95 duration-300">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              {/* 좌측 입력 */}
              <div className="p-8 md:p-10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    <Layers3 className="h-3.5 w-3.5" />
                    메뉴 구조 설정
                  </div>

                  <h3 className="mt-4 text-[2rem] font-black tracking-[-0.05em] text-slate-900">
                    {selectedMenu ? "메뉴 수정" : "메뉴 추가"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    메뉴명, 경로, 아이콘, 정렬 순서를 입력해 사이드바 구조를
                    관리합니다.
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-[1fr_120px]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        메뉴명
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        placeholder="예: 고객 관리"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        아이콘
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) =>
                          setFormData({ ...formData, icon: e.target.value })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      경로
                    </label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        required
                        value={formData.path}
                        onChange={(e) =>
                          setFormData({ ...formData, path: e.target.value })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        placeholder="/customers"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      정렬 순서
                    </label>
                    <div className="relative">
                      <ListOrdered className="pointer-events-none absolute right-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sort_order: Number(e.target.value),
                          })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-[1.3] rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>

              {/* 우측 미리보기 */}
              <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-white p-8 lg:border-l lg:border-t-0 lg:p-10">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-blue-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    실시간 미리보기
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-3xl shadow-inner">
                        {formData.icon || "📁"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[1.15rem] font-black tracking-[-0.04em] text-slate-900">
                          {formData.title || "메뉴명"}
                        </p>
                        <p className="mt-2 truncate rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                          {formData.path || "/"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.12em] text-slate-400">
                        정렬 순서
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                        {String(formData.sort_order).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>노출명</span>
                      <span className="font-semibold text-slate-700">
                        {formData.title || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>경로</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {formData.path || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>아이콘</span>
                      <span className="font-semibold text-slate-700">
                        {formData.icon || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}