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

    // 상담사 집계용 (상담일 기준)
    let consultQuery = supabase
      .from("customers")
      .select("*")
      .range(0, 9999);

    // 영업 집계용 (영업일 기준)
    let salesQuery = supabase
      .from("customers")
      .select("*")
      .range(0, 9999);

    if (from) {
      consultQuery = consultQuery.gte(
        "consult_date",
        `${from} 00:00:00`
      );

      salesQuery = salesQuery.gte(
        "sales_date",
        `${from} 00:00:00`
      );
    }

    if (to) {
      consultQuery = consultQuery.lt(
        "consult_date",
        `${getNextDate(to)} 00:00:00`
      );

      salesQuery = salesQuery.lt(
        "sales_date",
        `${getNextDate(to)} 00:00:00`
      );
    }

    const [consultRes, salesRes, uRes, groupRes] = await Promise.all([
      consultQuery,
      salesQuery,
      supabase.from("users").select("id, name, role_id"),
      supabase
        .from("code_groups")
        .select(
          "group_code, code_details(code_name, code_value, sort_order)"
        )
        .in("group_code", ["CONSULT_STATUS", "SALES_STATUS"]),
    ]);

    if (consultRes.error) throw consultRes.error;
    if (salesRes.error) throw salesRes.error;
    if (uRes.error) throw uRes.error;
    if (groupRes.error) throw groupRes.error;

    const consultFiltered = consultRes.data || [];
    const salesFiltered = salesRes.data || [];

    const users = uRes.data || [];
    const groups = groupRes.data || [];

    const consultGroup = groups.find(
      (g: any) => g.group_code === "CONSULT_STATUS"
    );

    const salesGroup = groups.find(
      (g: any) => g.group_code === "SALES_STATUS"
    );

    const consultDetails = [...(consultGroup?.code_details || [])].sort(
      (a: any, b: any) =>
        Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );

    const salesDetails = [...(salesGroup?.code_details || [])].sort(
      (a: any, b: any) =>
        Number(a.sort_order || 0) - Number(b.sort_order || 0)
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

    const consultHeaders = Array.from(
      new Set([
        ...consultDetails
          .map((d: any) => String(d.code_name || "").trim())
          .filter(Boolean),
        "대기",
        "미지정",
      ])
    );

    const salesHeaders = Array.from(
      new Set([
        ...salesDetails
          .map((d: any) => String(d.code_name || "").trim())
          .filter(Boolean),
        "미지정",
      ])
    );

    const normalizeConsultStatus = (value: unknown) => {
      const raw = String(value || "").trim();

      // 상담사 배정은 되어 있는데 상태가 없으면 대기 처리
      if (!raw) return "대기";

      return consultCodeToName[raw] || raw;
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
          statusCounts: Object.fromEntries(
            consultHeaders.map((h) => [h, 0])
          ),
        };
      }

      if (u.role_id === ROLE_SALES) {
        salesStats[u.id] = {
          id: u.id,
          name: u.name,
          total: 0,
          commission: 0,
          statusCounts: Object.fromEntries(
            salesHeaders.map((h) => [h, 0])
          ),
        };
      }
    });

    // 상담사 집계 (consult_date 기준)
    consultFiltered.forEach((c: any) => {
      if (c.tm_id && tmStats[c.tm_id]) {
        tmStats[c.tm_id].total += 1;

        const status = normalizeConsultStatus(
          c.consult_status
        );

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
    });

    // 영업 집계 (sales_date 기준)
    salesFiltered.forEach((c: any) => {
      if (c.sales_id && salesStats[c.sales_id]) {
        salesStats[c.sales_id].total += 1;

        salesStats[c.sales_id].commission += Number(
          c.sales_commission || 0
        );

        const status = normalizeSalesStatus(
          c.sales_status
        );

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
        // 상단 카드들은 영업 기준 유지
        total: salesFiltered.length,

        unassignedTM: salesFiltered.filter(
          (c: any) => !c.tm_id
        ).length,

        unassignedSales: salesFiltered.filter(
          (c: any) => !c.sales_id
        ).length,

        totalCommission: salesFiltered.reduce(
          (acc: number, cur: any) =>
            acc + Number(cur.sales_commission || 0),
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

    return NextResponse.json(
      { error: "API 집계 에러" },
      { status: 500 }
    );
  }
}