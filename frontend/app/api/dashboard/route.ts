import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ROLE_TM = "cd244076-ae70-489b-a8e4-1a7912bfc222";
const ROLE_SALES = "6f903ef9-ccc8-4f65-94be-41c401067d40";

function getNextDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + 1);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function normalizeText(value: unknown) {
  const text = String(value || "").trim();
  return text === "" ? "미지정" : text;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    let customerQuery = supabase
      .from("customers")
      .select("*")
      .range(0, 9999);

    // 핵심 수정: 대시보드 집계 기준을 영업일(sales_date)로 DB 조회 단계에서 필터링
    // 기존처럼 전체 조회 후 JS에서 필터링하면 Supabase 1,000건 제한 때문에 누락될 수 있음
    if (from) {
      customerQuery = customerQuery.gte("sales_date", `${from} 00:00:00`);
    }

    if (to) {
      customerQuery = customerQuery.lt("sales_date", `${getNextDate(to)} 00:00:00`);
    }

    const [cRes, uRes, groupRes] = await Promise.all([
      customerQuery,
      supabase.from("users").select("id, name, role_id"),
      supabase
        .from("code_groups")
        .select("group_code, code_details(code_name, code_value, sort_order)")
        .in("group_code", ["CONSULT_STATUS", "SALES_STATUS"]),
    ]);

    if (cRes.error) throw cRes.error;
    if (uRes.error) throw uRes.error;
    if (groupRes.error) throw groupRes.error;

    const filtered = cRes.data || [];
    const users = uRes.data || [];
    const groups = groupRes.data || [];

    const consultGroup = groups.find(
      (g: any) => g.group_code === "CONSULT_STATUS"
    );
    const salesGroup = groups.find(
      (g: any) => g.group_code === "SALES_STATUS"
    );

    const consultDetails = [...(consultGroup?.code_details || [])].sort(
      (a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );

    const salesDetails = [...(salesGroup?.code_details || [])].sort(
      (a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );

    const consultCodeToName = Object.fromEntries(
      consultDetails.map((d: any) => [
        String(d.code_value || "").trim(),
        String(d.code_name || "").trim(),
      ])
    );

    const salesCodeToName = Object.fromEntries(
      salesDetails.map((d: any) => [
        String(d.code_value || "").trim(),
        String(d.code_name || "").trim(),
      ])
    );

    const consultHeaders = [
      ...consultDetails
        .map((d: any) => String(d.code_name || "").trim())
        .filter(Boolean),
      "미지정",
    ];

    const salesHeaders = [
      ...salesDetails
        .map((d: any) => String(d.code_name || "").trim())
        .filter(Boolean),
      "미지정",
    ];

    const normalizeConsultStatus = (value: unknown) => {
      const text = normalizeText(value);
      if (text === "미지정") return "미지정";
      return consultCodeToName[text] || text;
    };

    const normalizeSalesStatus = (value: unknown) => {
      const text = normalizeText(value);
      if (text === "미지정") return "미지정";
      return salesCodeToName[text] || text;
    };

    const tmStats: Record<string, any> = {};
    const salesStats: Record<string, any> = {};

    users.forEach((u: any) => {
      if (u.role_id === ROLE_TM) {
        tmStats[u.id] = {
          id: u.id,
          name: u.name,
          total: 0,
          statusCounts: Object.fromEntries(consultHeaders.map((h) => [h, 0])),
        };
      }

      if (u.role_id === ROLE_SALES) {
        salesStats[u.id] = {
          id: u.id,
          name: u.name,
          total: 0,
          commission: 0,
          statusCounts: Object.fromEntries(salesHeaders.map((h) => [h, 0])),
        };
      }
    });

    filtered.forEach((c: any) => {
      if (c.tm_id && tmStats[c.tm_id]) {
        tmStats[c.tm_id].total += 1;

        const status = normalizeConsultStatus(c.consult_status);

        if (
          Object.prototype.hasOwnProperty.call(
            tmStats[c.tm_id].statusCounts,
            status
          )
        ) {
          tmStats[c.tm_id].statusCounts[status] += 1;
        } else {
          tmStats[c.tm_id].statusCounts["미지정"] += 1;
        }
      }

      if (c.sales_id && salesStats[c.sales_id]) {
        salesStats[c.sales_id].total += 1;
        salesStats[c.sales_id].commission += Number(c.sales_commission || 0);

        const status = normalizeSalesStatus(c.sales_status);

        if (
          Object.prototype.hasOwnProperty.call(
            salesStats[c.sales_id].statusCounts,
            status
          )
        ) {
          salesStats[c.sales_id].statusCounts[status] += 1;
        } else {
          salesStats[c.sales_id].statusCounts["미지정"] += 1;
        }
      }
    });

    return NextResponse.json({
      summary: {
        total: filtered.length,
        unassignedTM: filtered.filter((c: any) => !c.tm_id).length,
        unassignedSales: filtered.filter((c: any) => !c.sales_id).length,
        totalCommission: filtered.reduce(
          (acc: number, cur: any) => acc + Number(cur.sales_commission || 0),
          0
        ),
      },
      tmList: Object.values(tmStats),
      salesList: Object.values(salesStats),
      headers: {
        consult: consultHeaders,
        sales: salesHeaders,
      },
    });
  } catch (err) {
    console.error("API 집계 에러:", err);
    return NextResponse.json({ error: "API 집계 에러" }, { status: 500 });
  }
}