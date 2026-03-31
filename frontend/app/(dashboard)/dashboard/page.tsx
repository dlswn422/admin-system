const statCards = [
  { label: "전체 사용자", value: "128", change: "+12 this month" },
  { label: "활성 권한", value: "36", change: "+4 updated" },
  { label: "등록 메뉴", value: "18", change: "+2 new menus" },
  { label: "활성 세션", value: "24", change: "Realtime status" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-slate-400">{card.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              운영 요약
            </h3>
            <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              상세보기
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">오늘 등록 사용자</p>
              <p className="mt-2 text-2xl font-bold">12</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">비활성 계정</p>
              <p className="mt-2 text-2xl font-bold">4</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">권한 수정 요청</p>
              <p className="mt-2 text-2xl font-bold">7</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">최근 활동</h3>
          <ul className="mt-5 space-y-4">
            <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              사용자 권한이 수정되었습니다.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              신규 메뉴가 추가되었습니다.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              관리자 계정이 생성되었습니다.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}