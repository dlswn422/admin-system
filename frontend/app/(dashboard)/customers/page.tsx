"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  UserPlus,
  Search,
  RotateCw,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  AlertTriangle,
  Wallet,
  Mic,
  Download,
  UserCheck,
  Upload,
  Filter,
  Users,
  BriefcaseBusiness,
  CalendarDays,
  FileAudio,
  ExternalLink,
  Clock,
} from "lucide-react";

interface Customer {
  id: string;
  customer_name: string;
  company_name: string;
  mobile_phone: string;
  landline_phone: string;
  address: string;
  note: string;
  receipt_date: string;
  tm_id: string;
  consult_date: string;
  consult_status: string;
  consult_memo: string;
  sales_id: string;
  sales_date: string;
  sales_status: string;
  sales_memo: string;
  sales_commission: number;
}

interface User {
  id: string;
  name: string;
  role_name: string;
}

interface CommonCode {
  code_value: string;
  code_name: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

interface RecordingItem {
  id: string;
  customer_id: string;
  file_name: string;
  file_url: string;
  duration?: string | null;
  created_at?: string;
  created_by?: string | null;
}

type FilterState = {
  date_type: string;
  date_from: string;
  date_to: string;
  search: string;
  tm_id: string;
  sales_id: string;
  consult_status: string;
  sales_status: string;
};

const INITIAL_FILTERS: FilterState = {
  date_type: "접수일",
  date_from: "",
  date_to: "",
  search: "",
  tm_id: "all",
  sales_id: "all",
  consult_status: "all",
  sales_status: "all",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [salesCodes, setSalesCodes] = useState<CommonCode[]>([]);
  const [totalCount, setTotalCount] = useState(0); // 🌟 페이징을 위한 전체 개수 상태 추가
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [assignTmId, setAssignTmId] = useState("");
  const [assignSalesId, setAssignSalesId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null);

  const [isExcelUploading, setIsExcelUploading] = useState(false);

  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const recordingInputRef = useRef<HTMLInputElement | null>(null);

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesList = ["00", "10", "20", "30", "40", "50"];

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const formatDate = useCallback((val?: string | null) => {
    if (!val) return "-";
    return String(val).split("T")[0].replace(/-/g, ".");
  }, []);

  const getUserNameById = useCallback(
    (id?: string | null) => {
      if (!id || id === "unassigned") return "미배정";
      if (id === "assigned") return "배정 완료";
      return users.find((u) => u.id === id)?.name || "미배정";
    },
    [users]
  );

  const getStatusTone = useCallback((v?: string) => {
    const text = (v || "").trim();
    if (/(완료|계약|성공|종결)/.test(text)) {
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
    if (/(보류|취소|실패|부재)/.test(text)) {
      return "bg-rose-50 text-rose-500 border-rose-100";
    }
    return "bg-blue-50 text-blue-600 border-blue-100";
  }, []);

  const formatCommission = useCallback((value?: number | null) => {
    return `₩${Number(value || 0).toLocaleString()}`;
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(), // 🌟 서버 사이드 오프셋 계산
      }).toString();

      const [cRes, uRes, cCodeRes, sCodeRes] = await Promise.all([
        fetch(`/api/customers?${query}`),
        fetch("/api/users"),
        fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
        fetch("/api/codes/details/by-group?group_code=SALES_STATUS"),
      ]);

      const cData = await cRes.json();
      // 🌟 API 응답 구조 변화에 맞춰 데이터 추출 로직 수정
      const resultData = Array.isArray(cData) ? cData : Array.isArray(cData?.data) ? cData.data : [];
      const count = cData?.totalCount !== undefined ? cData.totalCount : resultData.length;

      setCustomers(resultData);
      setTotalCount(count); // 🌟 전체 개수 저장
      
      setUsers(await uRes.json());
      setConsultCodes(await cCodeRes.json());
      setSalesCodes(await sCodeRes.json());
    } catch {
      showToast("데이터 로드 실패", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, itemsPerPage, currentPage, showToast]);

  const fetchRecordings = useCallback(
    async (customerId: string) => {
      setIsRecordingsLoading(true);
      try {
        const res = await fetch(
          `/api/recordings/upload?customer_id=${encodeURIComponent(customerId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "녹취 목록 조회 실패");
        }

        setRecordings(Array.isArray(data) ? data : []);
      } catch (error) {
        setRecordings([]);
        showToast(error instanceof Error ? error.message : "녹취 목록 조회 실패", "error");
      } finally {
        setIsRecordingsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🌟 프론트엔드 slice 로직 제거 (서버에서 이미 잘려서 오기 때문)
  const paginatedData = useMemo(() => {
    return customers; 
  }, [customers]);

  // 🌟 totalCount 기반으로 전체 페이지 계산
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const totalCommission = useMemo(
    () =>
      customers.reduce(
        (sum, customer) => sum + Number(customer.sales_commission || 0),
        0
      ),
    [customers]
  );

  const assignedTmCount = useMemo(
    () => customers.filter((customer) => !!customer.tm_id).length,
    [customers]
  );

  const assignedSalesCount = useMemo(
    () => customers.filter((customer) => !!customer.sales_id).length,
    [customers]
  );

  const selectedCount = selectedIds.length;

  const resultSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.search) parts.push("검색 적용");
    
    if (filters.tm_id !== "all") {
      if (filters.tm_id === 'unassigned') parts.push("TM 미배정");
      else if (filters.tm_id === 'assigned') parts.push("TM 배정완료");
      else parts.push("TM 필터");
    }
    
    if (filters.sales_id !== "all") {
      if (filters.sales_id === 'unassigned') parts.push("영업자 미배정");
      else if (filters.sales_id === 'assigned') parts.push("영업자 배정완료");
      else parts.push("영업자 필터");
    }

    if (filters.consult_status !== "all") parts.push("상담 상태");
    if (filters.sales_status !== "all") parts.push("영업 상태");
    if (filters.date_from || filters.date_to) parts.push("기간 필터");

    if (parts.length === 0) return `총 ${totalCount}건`;
    return `${parts.join(" · ")} · ${totalCount}건`;
  }, [filters, totalCount]);

  const toggleSelectAll = () => {
    const currentIds = paginatedData.map((c) => c.id);
    const isAllOnPageSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.includes(id));

    if (isAllOnPageSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (type: "TM" | "SALES") => {
    const assigneeId = type === "TM" ? assignTmId : assignSalesId;
    if (!assigneeId) {
      return showToast("배정할 담당자를 선택해주세요.", "error");
    }
    if (selectedIds.length === 0) {
      return showToast("고객을 먼저 선택해주세요.", "error");
    }

    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, type, assignee_id: assigneeId }),
      });

      if (!res.ok) throw new Error("배정 중 오류 발생");

      showToast(`${selectedIds.length}명 일괄 배정 완료`);
      setSelectedIds([]);
      await fetchData();
    } catch (e) {
      showToast("배정 중 오류 발생", "error");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return showToast("삭제할 고객을 먼저 선택해주세요.", "error");
    }
    setIsBulkDeleteMode(true);
    setIsDeleteModalOpen(true);
  };

  const excelEscape = (value: string) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const downloadTemplate = () => {
    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default"><Font ss:FontName="맑은 고딕" ss:Size="11"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="맑은 고딕" ss:Size="12" ss:Bold="1"/></Style>
  <Style ss:ID="Notice"><Interior ss:Color="#E2F0D9" ss:Pattern="Solid"/><Font ss:FontName="맑은 고딕" ss:Size="11"/></Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="맑은 고딕" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="HeaderRequired">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="맑은 고딕" ss:Size="11" ss:Bold="1" ss:Color="#C00000"/>
  </Style>
  <Style ss:ID="Body">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="고객일괄등록">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="340"/>
   <Column ss:Width="240"/>
   <Row ss:Height="26"><Cell ss:StyleID="Title" ss:MergeAcross="5"><Data ss:Type="String">${excelEscape("일괄 등록 주의 사항")}</Data></Cell></Row>
   <Row ss:Height="26"><Cell ss:StyleID="Notice" ss:MergeAcross="5"><Data ss:Type="String">${excelEscape("- 해당 파일의 형식을 임의 대로 수정하거나 필수값을 입력하지 않으시면 정상적으로 등록되지 않을 수 있습니다.")}</Data></Cell></Row>
   <Row ss:Height="26"><Cell ss:StyleID="Notice" ss:MergeAcross="5"><Data ss:Type="String">${excelEscape("- 공백이 포함된 행이 있는지 주의 부탁드립니다. 빈 값의 데이터 행이 등록될 수 있습니다.")}</Data></Cell></Row>
   <Row ss:Height="26"><Cell ss:StyleID="Notice" ss:MergeAcross="5"><Data ss:Type="String">${excelEscape('- 모든 항목의 셀 표시 형식(서식)이 "텍스트"로 설정된 것을 확인 후 파일을 업로드해 주세요.')}</Data></Cell></Row>
   <Row ss:Height="28">
    <Cell ss:StyleID="HeaderRequired"><Data ss:Type="String">업체명*</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">대표자명</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">유선</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">핸드폰</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">주소</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">비고</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="Body"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "고객일괄등록_양식.xls";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExcelUploading(true);
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/customers/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "엑셀 업로드 실패");

      showToast(`${Number(data?.insertedCount || 0)}건 업로드 완료`);
      await fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "엑셀 업로드 실패", "error");
    } finally {
      setIsExcelUploading(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  };

  const openModal = async (customer: Customer | null = null) => {
    setSelectedCustomer(customer);
    if (customer) {
      const cleanDate = customer.consult_date ? customer.consult_date.replace("T", " ") : "";
      setFormData({ ...customer, consult_date: cleanDate });
    } else {
      setFormData({ receipt_date: new Date().toISOString().split("T")[0], sales_commission: 0 });
    }
    setRecordings([]);
    setIsModalOpen(true);

    if (customer?.id) {
      await fetchRecordings(customer.id);
    }
  };

  const openDeleteModal = (customer: Customer) => {
    setDeleteTarget(customer);
    setIsBulkDeleteMode(false);
    setIsDeleteModalOpen(true);
  };

  const handleRecordingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCustomer?.id) {
      showToast("기존 고객 상세에서만 녹취 업로드가 가능합니다.", "error");
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingRecording(true);
      const body = new FormData();
      body.append("file", file);
      body.append("customer_id", selectedCustomer.id);

      const res = await fetch("/api/recordings/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "녹취 업로드 실패");

      showToast("녹취 파일이 업로드되었습니다.");
      await fetchRecordings(selectedCustomer.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "녹취 업로드 실패", "error");
    } finally {
      setIsUploadingRecording(false);
      if (recordingInputRef.current) recordingInputRef.current.value = "";
    }
  };

  const handleRecordingDelete = async (recordingId: string) => {
    if (!selectedCustomer?.id) return;

    try {
      setDeletingRecordingId(recordingId);
      const res = await fetch("/api/recordings/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordingId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "녹취 삭제 실패");

      showToast("녹취 파일이 삭제되었습니다.");
      await fetchRecordings(selectedCustomer.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "녹취 삭제 실패", "error");
    } finally {
      setDeletingRecordingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const companyName = String(formData.company_name || "").trim();
    if (!companyName) {
      showToast("업체명은 필수값입니다.", "error");
      return;
    }

    const url = selectedCustomer ? `/api/customers/${selectedCustomer.id}` : "/api/customers";
    const payload = {
      ...formData,
      company_name: companyName,
      sales_commission: Number(formData.sales_commission || 0),
    };

    const res = await fetch(url, {
      method: selectedCustomer ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast("저장되었습니다.");
      fetchData();
    }
  };

  const confirmDelete = async () => {
    try {
      let res;
      if (isBulkDeleteMode) {
        res = await fetch(`/api/customers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });
      } else {
        if (!deleteTarget) return;
        res = await fetch(`/api/customers/${encodeURIComponent(deleteTarget.id)}`, {
          method: "DELETE",
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "삭제 처리 중 오류가 발생했습니다.");
      }

      showToast(isBulkDeleteMode ? `${selectedIds.length}건 삭제 완료` : "삭제 완료");
      
      if (isBulkDeleteMode) {
        setSelectedIds([]);
      } else if (deleteTarget) {
        setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
      }

      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setIsBulkDeleteMode(false);
      await fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "삭제 실패", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20 px-4 md:px-0">
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
      <input ref={recordingInputRef} type="file" accept="*/*" className="hidden" onChange={handleRecordingUpload} />

      {toast && (
        <div
          className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] border border-white/10 px-5 py-4 shadow-[0_24px_50px_rgba(15,23,42,0.25)] backdrop-blur-2xl animate-in slide-in-from-right-8 duration-300 ${
            toast.type === "success" ? "bg-slate-900/90 text-white" : "bg-rose-600/90 text-white"
          }`}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
          <p className="text-sm font-bold tracking-[-0.02em]">{toast.message}</p>
        </div>
      )}

      {/* Header Section */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,18,36,0.88))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.18)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,transparent_72%,rgba(59,130,246,0.06))]" />
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-blue-500/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
                <Layers className="h-3.5 w-3.5" />
                고객 파이프라인
              </div>
              <h1 className="text-[1.9rem] font-black leading-[1.02] tracking-[-0.05em] text-white md:text-[2.4rem]">
                고객 관리
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                고객 접수부터 상담, 영업 배정, 정산 정보까지 한 화면에서 통합
                관리합니다. 운영 흐름을 빠르게 확인하고 즉시 대응할 수 있도록
                일관된 관리 시스템 구조로 정리했습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchData}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                aria-label="새로고침"
                type="button"
              >
                <RotateCw className={`h-5 w-5 transition-transform duration-500 ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`} />
              </button>
              <button
                onClick={downloadTemplate}
                className="inline-flex h-14 items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.06] px-5 text-sm font-bold text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1]"
                type="button"
              >
                <Download className="h-4.5 w-4.5" />
                양식 다운로드
              </button>
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                disabled={isExcelUploading}
                className="inline-flex h-14 items-center gap-2 rounded-[20px] border border-emerald-400/15 bg-emerald-500/10 px-5 text-sm font-bold text-emerald-100 shadow-[0_14px_28px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/15 disabled:opacity-60"
              >
                <Upload className="h-4.5 w-4.5" />
                {isExcelUploading ? "업로드 중..." : "엑셀 업로드"}
              </button>
              <button
                onClick={() => openModal()}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 px-6 py-4 text-sm font-extrabold tracking-[-0.02em] text-white shadow-[0_18px_36px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(59,130,246,0.32)] active:scale-[0.98]"
                type="button"
              >
                <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.16)_20%,transparent_42%)] [animation:shimmer-x_2.8s_linear_infinite]" />
                <UserPlus className="relative z-10 h-4.5 w-4.5" />
                <span className="relative z-10">신규 고객 추가</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "전체 고객", value: totalCount.toString().padStart(2, "0"), icon: Users, tone: "bg-blue-500/10 text-blue-600 ring-blue-500/15" },
          { label: "TM 배정 고객", value: assignedTmCount.toString().padStart(2, "0"), icon: Mic, tone: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15" },
          { label: "영업 배정 고객", value: assignedSalesCount.toString().padStart(2, "0"), icon: BriefcaseBusiness, tone: "bg-violet-500/10 text-violet-600 ring-violet-500/15" },
          { label: "누적 정산금액", value: `₩${totalCommission.toLocaleString()}`, icon: Wallet, tone: "bg-slate-900/10 text-slate-700 ring-slate-300/40" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="fade-up group rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/95 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 truncate text-[2rem] font-black tracking-[-0.05em] text-slate-900">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${stat.tone}`}><Icon className="h-5 w-5" /></div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">{stat.label} 현황 요약</p>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <section className="fade-up rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="grid items-start gap-3 xl:grid-cols-[180px_minmax(0,1fr)_260px]">
          <div className="relative self-start">
            <Filter className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
            <select value={filters.date_type} onChange={(e) => setFilters({ ...filters, date_type: e.target.value })} className="h-14 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none">
              <option>접수일</option><option>상담일</option>
            </select>
          </div>
          <div className="grid items-start gap-3 md:grid-cols-[140px_auto_140px_minmax(0,1fr)]">
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none" />
            <div className="flex h-14 items-center justify-center text-slate-300 font-black">~</div>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none" />
            <div className="relative self-start group">
              <Search className="absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="업체명, 대표자, 연락처 검색" className="h-14 w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none" />
            </div>
          </div>
          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="flex gap-2">
              <select value={assignTmId} onChange={(e) => setAssignTmId(e.target.value)} className="h-14 min-w-0 flex-1 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
                <option value="">TM 선택</option>
                {users.filter((u) => u.role_name === "TM").map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              <button type="button" onClick={() => handleBulkAssign("TM")} className="h-14 rounded-[20px] bg-slate-900 px-4 text-sm font-black text-white">TM 배정</button>
            </div>
            <div className="flex gap-2">
              <select value={assignSalesId} onChange={(e) => setAssignSalesId(e.target.value)} className="h-14 min-w-0 flex-1 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
                <option value="">영업사원 선택</option>
                {users.filter((u) => u.role_name === "영업").map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              <button type="button" onClick={() => handleBulkAssign("SALES")} className="h-14 rounded-[20px] bg-slate-900 px-4 text-sm font-black text-white">영업 배정</button>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <select value={filters.tm_id} onChange={(e) => setFilters({ ...filters, tm_id: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
            <option value="all">담당 TM 전체</option>
            <option value="assigned">배정 완료</option>
            <option value="unassigned">미배정</option>
            {users.filter((u) => u.role_name === "TM").map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
          <select value={filters.consult_status} onChange={(e) => setFilters({ ...filters, consult_status: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
            <option value="all">상담 상태 전체</option>
            {consultCodes.map((c) => (<option key={c.code_value} value={c.code_name}>{c.code_name}</option>))}
          </select>
          <select value={filters.sales_id} onChange={(e) => setFilters({ ...filters, sales_id: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
            <option value="all">영업자 전체</option>
            <option value="assigned">배정 완료</option>
            <option value="unassigned">미배정</option>
            {users.filter((u) => u.role_name === "영업").map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
          <select value={filters.sales_status} onChange={(e) => setFilters({ ...filters, sales_status: e.target.value })} className="h-14 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none">
            <option value="all">영업 상태 전체</option>
            {salesCodes.map((s) => (<option key={s.code_value} value={s.code_name}>{s.code_name}</option>))}
          </select>
          <button type="button" onClick={() => setFilters(INITIAL_FILTERS)} className="h-14 rounded-[20px] border border-slate-200 bg-white px-5 text-sm font-bold text-slate-500">초기화</button>
          <div className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-600">
            <Sparkles className="h-4 w-4" />
            {selectedCount > 0 ? `${selectedCount}건 선택됨` : resultSummary}
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="fade-up overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">고객 레지스트리</h2>
              <p className="mt-1 text-sm text-slate-500">고객 기본정보와 상담/영업 상태를 빠르게 조회하고 수정할 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  선택 {selectedIds.length}건 일괄 삭제
                </button>
              )}
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none">
                <option value={10}>10개씩</option><option value={50}>50개씩</option><option value={100}>100개씩</option><option value={500}>500개씩</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-5 overflow-hidden">
          <div className="w-full space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-[24px] border border-slate-100 bg-slate-50/80 animate-pulse" />)
            ) : (
              <>
                <div className="grid items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3 text-[10px] font-bold tracking-[0.1em] text-slate-400 grid-cols-[40px_90px_minmax(120px,1.5fr)_90px_110px_minmax(120px,2fr)_80px_90px_90px_90px_90px_40px]">
                  <div className="flex justify-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer" checked={paginatedData.length > 0 && paginatedData.every(c => selectedIds.includes(c.id))} onChange={toggleSelectAll} />
                  </div>
                  <span className="text-center">상담일자</span><span>업체 정보</span><span className="text-center">대표자명</span><span className="text-center">핸드폰</span><span>주소</span><span className="text-center">접수일</span><span className="text-center">담당 TM</span><span className="text-center">상담상태</span><span className="text-center">영업담당</span><span className="text-right">영업수당</span><span className="text-center">삭제</span>
                </div>

                {paginatedData.map((c) => {
                  const hasDate = c.consult_date && c.consult_date !== "null";
                  const cleanDateStr = hasDate ? c.consult_date.replace("T", " ") : "";
                  const datePart = hasDate ? cleanDateStr.split(" ")[0].replace(/-/g, ".") : "-";
                  const timePart = hasDate ? cleanDateStr.split(" ")[1]?.slice(0, 5) : "";
                  return (
                    <div key={c.id} className="group rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-blue-200">
                      <div className="grid items-center gap-3 grid-cols-[40px_90px_minmax(120px,1.5fr)_90px_110px_minmax(120px,2fr)_80px_90px_90px_90px_90px_40px]">
                        <div className="flex justify-center">
                          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                        </div>
                        <button type="button" onClick={() => openModal(c)} className="text-center flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{datePart}</span>
                          {timePart && <span className="text-[10px] font-black text-blue-500 mt-0.5">{timePart}</span>}
                        </button>
                        <button type="button" onClick={() => openModal(c)} className="text-left overflow-hidden">
                          <div className="truncate text-sm font-black tracking-[-0.03em] text-slate-900">{c.company_name || "-"}</div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-500">{c.note || c.landline_phone || "-"}</div>
                        </button>
                        <button type="button" onClick={() => openModal(c)} className="text-center text-xs font-semibold text-slate-700 truncate">{c.customer_name || "-"}</button>
                        <button type="button" onClick={() => openModal(c)} className="text-center text-xs font-semibold text-slate-700 truncate">{c.mobile_phone || "-"}</button>
                        <button type="button" onClick={() => openModal(c)} className="truncate text-left text-xs font-semibold text-slate-700">{c.address || "-"}</button>
                        <button type="button" onClick={() => openModal(c)} className="text-center text-xs font-semibold text-slate-700">{formatDate(c.receipt_date)}</button>
                        <button type="button" onClick={() => openModal(c)} className="text-center text-xs font-semibold text-slate-700 truncate">{getUserNameById(c.tm_id)}</button>
                        <button type="button" onClick={() => openModal(c)} className="flex justify-center">
                          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusTone(c.consult_status)}`}>{c.consult_status || "미지정"}</span>
                        </button>
                        <button type="button" onClick={() => openModal(c)} className="text-center text-xs font-semibold text-slate-700 truncate">{getUserNameById(c.sales_id)}</button>
                        <button type="button" onClick={() => openModal(c)} className="text-right text-xs font-black text-slate-900">{formatCommission(c.sales_commission)}</button>
                        <div className="flex justify-center">
                          <button type="button" onClick={() => openDeleteModal(c)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-slate-400">총 {totalCount}건 중 {paginatedData.length}건 표시</div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all"><ChevronLeft className="h-5 w-5" /></button>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-slate-500" /><span className="text-sm font-bold text-slate-700">{currentPage}</span><span className="text-sm font-bold text-slate-400">/</span><span className="text-sm font-bold text-slate-400">{totalPages}</span>
              </div>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-2xl flex flex-col text-slate-900">
            <div className="custom-scrollbar flex-1 overflow-y-auto p-8 md:p-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition-all hover:text-slate-900"><X className="h-5 w-5" /></button>

              <div className="mb-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase"><UserCheck className="h-3.5 w-3.5" />고객 데이터 설정</div>
                <h2 className="mt-4 text-[2rem] font-black tracking-[-0.05em] text-slate-900">{selectedCustomer ? "고객 정보 수정" : "신규 고객 등록"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">업체 정보와 상담/영업 진행 상황을 한 번에 관리합니다.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                {/* 기본 정보 */}
                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-2"><div className="h-7 w-1 rounded-full bg-blue-500" /><h3 className="text-sm font-black tracking-[0.15em] text-slate-900">기본 정보</h3></div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">업체명 <span className="text-rose-500">*</span></span>
                      <input value={formData.company_name || ""} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">대표자명</span>
                      <input value={formData.customer_name || ""} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" />
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">접수일</span>
                      <input type="date" value={formData.receipt_date || ""} onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" />
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">유선전화</span>
                      <input value={formData.landline_phone || ""} onChange={(e) => setFormData({ ...formData, landline_phone: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" />
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">핸드폰</span>
                      <input value={formData.mobile_phone || ""} onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" />
                    </label>
                    
                    <div className="hidden xl:block" />

                    <label className="space-y-2 md:col-span-2 xl:col-span-3">
                      <span className="text-sm font-bold text-slate-700">비고</span>
                      <textarea value={formData.note || ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="min-h-[110px] w-full rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 transition-all resize-none shadow-sm" />
                    </label>

                    <label className="space-y-2 md:col-span-2 xl:col-span-3 pt-2">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">상세 주소 (Address)</span>
                      <textarea 
                        value={formData.address || ""} 
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                        className="min-h-[120px] w-full rounded-[24px] border-2 border-slate-200 bg-white px-6 py-5 text-[15px] font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none shadow-inner" 
                        placeholder="전체 주소를 한눈에 보기 편하게 입력하세요."
                      />
                    </label>
                  </div>
                </section>

                {/* 상담 정보 */}
                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-2"><div className="h-7 w-1 rounded-full bg-emerald-500" /><h3 className="text-sm font-black tracking-[0.15em] text-slate-900">상담 정보</h3></div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2 xl:col-span-1">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 상담일시 (날짜 / 시 / 분)</span>
                      <div className="flex gap-2">
                        <input type="date" value={formData.consult_date ? formData.consult_date.split(" ")[0] : ""} onChange={(e) => {
                          const time = formData.consult_date?.split(" ")[1] || "09:00:00";
                          setFormData({ ...formData, consult_date: `${e.target.value} ${time}` });
                        }} className="h-14 flex-[2] rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500" />
                        <select value={formData.consult_date && formData.consult_date.split(" ")[1] ? formData.consult_date.split(" ")[1].split(":")[0] : "09"} onChange={(e) => {
                          const date = formData.consult_date?.split(" ")[0] || "";
                          const min = formData.consult_date?.split(" ")[1]?.split(":")[1] || "00";
                          setFormData({ ...formData, consult_date: `${date} ${e.target.value}:${min}:00` });
                        }} className="h-14 flex-1 rounded-[18px] border border-slate-200 bg-white px-2 text-sm font-black text-center text-slate-900 outline-none focus:border-emerald-500">
                          {hoursList.map(h => <option key={h} value={h}>{h}시</option>)}
                        </select>
                        <select value={formData.consult_date && formData.consult_date.split(" ")[1] ? formData.consult_date.split(" ")[1].split(":")[1] : "00"} onChange={(e) => {
                          const date = formData.consult_date?.split(" ")[0] || "";
                          const hr = formData.consult_date?.split(" ")[1]?.split(":")[0] || "09";
                          setFormData({ ...formData, consult_date: `${date} ${hr}:${e.target.value}:00` });
                        }} className="h-14 flex-1 rounded-[18px] border border-slate-200 bg-white px-2 text-sm font-black text-center text-slate-900 outline-none focus:border-emerald-500">
                          {minutesList.map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">상담 상태</span>
                      <select value={formData.consult_status || ""} onChange={(e) => setFormData({ ...formData, consult_status: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none">
                        <option value="">선택 안함</option>
                        {consultCodes.map((c) => (<option key={c.code_value} value={c.code_name}>{c.code_name}</option>))}
                      </select>
                    </label>
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-4 flex flex-col justify-center">
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">녹취 업로드</div>
                      <button type="button" onClick={() => recordingInputRef.current?.click()} disabled={!selectedCustomer || isUploadingRecording} className="mt-2 inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition-all">
                        <Upload className="h-4 w-4" />{isUploadingRecording ? "업로드 중..." : "파일 업로드"}
                      </button>
                    </div>
                    <label className="space-y-2 md:col-span-2 xl:col-span-3"><span className="text-sm font-bold text-slate-700">상담 메모</span>
                      <textarea value={formData.consult_memo || ""} onChange={(e) => setFormData({ ...formData, consult_memo: e.target.value })} className="min-h-[110px] w-full rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none" />
                    </label>
                    <div className="md:col-span-2 xl:col-span-3">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between gap-3"><div className="text-sm font-black text-slate-900">상담 녹취 파일 목록</div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{recordings.length}개 파일</div></div>
                        {isRecordingsLoading ? (<div className="h-20 animate-pulse bg-slate-50 rounded-2xl" />) : recordings.length > 0 ? (
                          <div className="space-y-2">
                            {recordings.map((recording) => (
                              <div key={recording.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                                <div className="flex items-center gap-3 overflow-hidden"><FileAudio className="h-4 w-4 text-violet-500 flex-none" /><span className="truncate text-xs font-bold text-slate-700">{recording.file_name}</span></div>
                                <div className="flex items-center gap-2"><a href={recording.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-500"><ExternalLink className="h-4 w-4" /></a><button type="button" onClick={() => handleRecordingDelete(recording.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></div>
                              </div>
                            ))}
                          </div>
                        ) : (<div className="text-center py-6 text-xs font-bold text-slate-400 italic">등록된 파일이 없습니다.</div>)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 영업 정보 */}
                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-2"><div className="h-7 w-1 rounded-full bg-violet-500" /><h3 className="text-sm font-black tracking-[0.15em] text-slate-900">영업 정보</h3></div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">영업담당</span>
                      <select value={formData.sales_id || ""} onChange={(e) => setFormData({ ...formData, sales_id: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none">
                        <option value="">선택 안함</option>
                        {users.filter((u) => u.role_name === "영업").map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                      </select>
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">영업일자</span><input type="date" value={formData.sales_date || ""} onChange={(e) => setFormData({ ...formData, sales_date: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" /></label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">영업 상태</span>
                      <select value={formData.sales_status || ""} onChange={(e) => setFormData({ ...formData, sales_status: e.target.value })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none">
                        <option value="">선택 안함</option>
                        {salesCodes.map((s) => (<option key={s.code_value} value={s.code_name}>{s.code_name}</option>))}
                      </select>
                    </label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700">영업수당</span><input type="number" value={String(formData.sales_commission ?? 0)} onChange={(e) => setFormData({ ...formData, sales_commission: Number(e.target.value || 0) })} className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none" /></label>
                    <label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-slate-700">영업 메모</span><textarea value={formData.sales_memo || ""} onChange={(e) => setFormData({ ...formData, sales_memo: e.target.value })} className="min-h-[110px] w-full rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none" /></label>
                  </div>
                </section>

                {/* Footer Buttons */}
                <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between">
                  <div className="text-sm font-semibold text-slate-600 italic">업체명 필수 입력 후 저장 가능합니다.</div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50">취소</button>
                    <button type="submit" disabled={!String(formData.company_name || "").trim()} className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-10 py-4 text-sm font-black text-white disabled:opacity-60 transition-all hover:shadow-lg">저장</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-10 text-center shadow-[0_40px_90px_rgba(15,23,42,0.25)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-rose-50 text-rose-500 shadow-inner"><AlertTriangle className="h-9 w-9" /></div>
            <h3 className="text-[1.8rem] font-black tracking-[-0.05em] text-slate-900">
              {isBulkDeleteMode ? "일괄 삭제" : "고객 삭제"}
            </h3>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              {isBulkDeleteMode ? (
                <>선택한 <span className="font-bold text-slate-800">{selectedIds.length}건</span>의 고객 정보를 모두 삭제하시겠습니까?</>
              ) : (
                <><span className="font-bold text-slate-800">{deleteTarget?.company_name}</span> 고객 정보를 삭제하시겠습니까?</>
              )}
              <br />삭제 후 복구가 불가능합니다.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button type="button" onClick={confirmDelete} className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-black text-white hover:bg-rose-700 transition-all">삭제</button>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}