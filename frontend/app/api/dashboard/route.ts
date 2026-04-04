import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const [cRes, uRes, groupRes] = await Promise.all([
      supabase.from("customers").select("*"),
      supabase.from("users").select("id, name, role_id"),
      supabase.from("code_groups")
        .select("group_code, code_details(code_name, code_value, sort_order)")
        .in("group_code", ["CONSULT_STATUS", "SALES_STATUS"])
    ]);

    const allCustomers = cRes.data || [];
    const users = uRes.data || [];
    const groups = groupRes.data || [];

    // 1. 헤더 정리 및 "미지정" 항목 강제 추가
    const consultGroup = groups.find(g => g.group_code === 'CONSULT_STATUS');
    const salesGroup = groups.find(g => g.group_code === 'SALES_STATUS');

    const consultHeaders = [
      ...(consultGroup?.code_details?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((d: any) => d.code_name) || []),
      "미지정"
    ];

    const salesHeaders = [
      ...(salesGroup?.code_details?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((d: any) => d.code_name) || []),
      "미지정"
    ];

    const ROLE_TM = "cd244076-ae70-489b-a8e4-1a7912bfc222";
    const ROLE_SALES = "6f903ef9-ccc8-4f65-94be-41c401067d40";

    // 2. 기간 필터링
    let filtered = allCustomers;
    if (from && to) {
      filtered = allCustomers.filter(c => c.receipt_date && c.receipt_date >= from && c.receipt_date <= to);
    }

    // 3. 집계 초기화
    const tmStats: Record<string, any> = {};
    const salesStats: Record<string, any> = {};

    users.forEach(u => {
      if (u.role_id === ROLE_TM) {
        tmStats[u.id] = { name: u.name, total: 0, statusCounts: Object.fromEntries(consultHeaders.map(h => [h, 0])) };
      } else if (u.role_id === ROLE_SALES) {
        salesStats[u.id] = { name: u.name, total: 0, commission: 0, statusCounts: Object.fromEntries(salesHeaders.map(h => [h, 0])) };
      }
    });

    // 4. 실적 집계 (null 체크 및 미지정 할당 로직)
    filtered.forEach(c => {
      // TM 집계
      if (c.tm_id && tmStats[c.tm_id]) {
        tmStats[c.tm_id].total += 1;
        const s = c.consult_status || "미지정"; // null이면 미지정으로
        if (tmStats[c.tm_id].statusCounts.hasOwnProperty(s)) {
          tmStats[c.tm_id].statusCounts[s] += 1;
        } else {
          tmStats[c.tm_id].statusCounts["미지정"] += 1;
        }
      }
      // 영업 집계
      if (c.sales_id && salesStats[c.sales_id]) {
        salesStats[c.sales_id].total += 1;
        salesStats[c.sales_id].commission += (Number(c.sales_commission) || 0);
        const s = c.sales_status || "미지정"; // null이면 미지정으로
        if (salesStats[c.sales_id].statusCounts.hasOwnProperty(s)) {
          salesStats[c.sales_id].statusCounts[s] += 1;
        } else {
          salesStats[c.sales_id].statusCounts["미지정"] += 1;
        }
      }
    });

    return NextResponse.json({
      summary: {
        total: filtered.length,
        unassignedTM: allCustomers.filter(c => !c.tm_id).length,
        unassignedSales: allCustomers.filter(c => !c.sales_id).length,
        totalCommission: filtered.reduce((acc, cur) => acc + (Number(cur.sales_commission) || 0), 0),
      },
      tmList: Object.values(tmStats),
      salesList: Object.values(salesStats),
      headers: { consult: consultHeaders, sales: salesHeaders }
    });
  } catch (err) {
    return NextResponse.json({ error: "API 집계 에러" }, { status: 500 });
  }
}