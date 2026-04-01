import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  MenuSquare,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

const statCards = [
  {
    label: "전체 사용자",
    value: "128",
    change: "이번 달 +12명",
    icon: Users,
    tone:
      "from-blue-500/16 via-blue-500/8 to-transparent text-blue-600 ring-blue-500/20",
  },
  {
    label: "활성 권한",
    value: "36",
    change: "최근 수정 +4건",
    icon: ShieldCheck,
    tone:
      "from-violet-500/16 via-violet-500/8 to-transparent text-violet-600 ring-violet-500/20",
  },
  {
    label: "등록 메뉴",
    value: "18",
    change: "신규 메뉴 +2개",
    icon: MenuSquare,
    tone:
      "from-amber-500/16 via-amber-500/8 to-transparent text-amber-600 ring-amber-500/20",
  },
  {
    label: "활성 세션",
    value: "24",
    change: "실시간 상태 정상",
    icon: Activity,
    tone:
      "from-emerald-500/16 via-emerald-500/8 to-transparent text-emerald-600 ring-emerald-500/20",
  },
];

const summaryCards = [
  {
    label: "오늘 등록 사용자",
    value: "12",
    desc: "어제 대비 +3",
    icon: UserPlus,
    tone: "text-blue-600 bg-blue-500/10 ring-blue-500/20",
  },
  {
    label: "비활성 계정",
    value: "4",
    desc: "검토 필요",
    icon: BadgeCheck,
    tone: "text-amber-600 bg-amber-500/10 ring-amber-500/20",
  },
  {
    label: "권한 수정 요청",
    value: "7",
    desc: "승인 대기",
    icon: ShieldCheck,
    tone: "text-violet-600 bg-violet-500/10 ring-violet-500/20",
  },
];

const activityItems = [
  {
    type: "권한",
    text: "사용자 권한이 수정되었습니다.",
    time: "방금 전",
    tone: "bg-blue-500",
  },
  {
    type: "메뉴",
    text: "신규 메뉴가 추가되었습니다.",
    time: "12분 전",
    tone: "bg-violet-500",
  },
  {
    type: "계정",
    text: "관리자 계정이 생성되었습니다.",
    time: "32분 전",
    tone: "bg-emerald-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* 히어로 패널 */}
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
                <Clock3 className="h-3.5 w-3.5" />
                실시간 운영 현황
              </div>

              <h2 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                통합 운영 대시보드
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                사용자, 권한, 메뉴, 세션 상태를 한눈에 확인하고 즉시 대응할 수
                있는 운영 중심 화면입니다. 주요 변화 흐름과 실시간 상태를 빠르게
                파악할 수 있도록 구성했습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_14px_28px_rgba(2,6,23,0.16)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 [animation:dot-ping-soft_1.8s_ease-out_infinite]" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  정상 운영 중
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  전체 운영 시스템이 안정적으로 유지되고 있습니다.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_14px_28px_rgba(2,6,23,0.16)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ArrowUpRight className="h-4 w-4 text-blue-300" />
                  실시간 반영
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  최신 사용자/권한 변경 내역이 즉시 반영됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 카드 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="fade-up group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/95 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.65),transparent_36%,transparent_72%,rgba(59,130,246,0.03))]" />
              <div
                className={`absolute -right-6 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${card.tone.split(" ")[0]} ${card.tone.split(" ")[1]} ${card.tone.split(" ")[2]} blur-2xl`}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-[2rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                      {card.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} ring-1 shadow-inner`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 하단 섹션 */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* 운영 요약 */}
        <div className="fade-up rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] xl:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
                운영 요약
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                오늘 기준 주요 운영 지표를 빠르게 확인할 수 있습니다.
              </p>
            </div>
            <button className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-[15px] font-black tracking-[-0.02em] text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50">
              상세보기
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="group rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${item.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      오늘 기준
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-[1.85rem] font-black leading-none tracking-[-0.05em] text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="fade-up rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
                최근 활동
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                최근 시스템 변경 이력을 확인하세요.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          <ul className="space-y-3">
            {activityItems.map((item, index) => (
              <li
                key={`${item.type}-${index}`}
                className="group rounded-[22px] border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_10px_22px_rgba(15,23,42,0.05)]"
                style={{ animationDelay: `${160 + index * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone} shadow-[0_0_10px_rgba(59,130,246,0.22)]`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold tracking-[0.08em] text-slate-400">
                        {item.type}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}