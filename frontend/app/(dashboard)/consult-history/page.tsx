"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Search,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  UserCheck,
  Upload,
  Filter,
  FileAudio,
  ExternalLink,
  Trash2,
  Clock,
  MapPin,
  UserPlus,
} from "lucide-react";

// --- Interfaces ---
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
}

interface UserData {
  id: string;
  name: string;
  role_id?: string;
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
}

type FilterState = {
  date_from: string;
  date_to: string;
  search: string;
  tm_id: string;
  consult_status: string;
};

export default function ConsultationPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // --- States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [consultCodes, setConsultCodes] = useState<CommonCode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    search: "",
    tm_id: "all",
    consult_status: "대기",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const [recordingDeleteTarget, setRecordingDeleteTarget] =
    useState<RecordingItem | null>(null);
  const [isRecordingDeleteModalOpen, setIsRecordingDeleteModalOpen] =
    useState(false);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [pendingRecordingFile, setPendingRecordingFile] = useState<File | null>(null);
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingRecording, setIsDeletingRecording] = useState(false);

  const recordingInputRef = useRef<HTMLInputElement | null>(null);

  const hoursList = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutesList = ["00", "10", "20", "30", "40", "50"];

  const isCreateMode = !selectedCustomer;
  const isAdmin = (currentUser?.role_name || (currentUser as any)?.role) === "관리자";
  const isModalBusy = isSaving || isUploading || isDeletingRecording;

  const modalLoadingMessage = isSaving
    ? isCreateMode
      ? pendingRecordingFile
        ? "고객 정보와 녹취 파일을 저장하는 중입니다..."
        : "신규 고객을 저장하는 중입니다..."
      : "변경 내용을 저장하는 중입니다..."
    : isUploading
    ? "녹취 파일을 업로드하는 중입니다..."
    : isDeletingRecording
    ? "녹취 파일을 삭제하는 중입니다..."
    : "처리 중입니다...";

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDefaultConsultDate = () => `${getTodayDateString()} 09:00:00`;

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // --- Data Fetching (원본 로직 보존) ---
  const fetchData = useCallback(
    async (userOverride?: UserData) => {
      const activeUser = userOverride || currentUser;
      if (!activeUser) return;

      setIsLoading(true);
      try {
        const params: Record<string, string> = {
          date_type: "상담일",
          limit: String(itemsPerPage),
          offset: String((currentPage - 1) * itemsPerPage),
        };

        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.search) params.search = filters.search;
        if (filters.consult_status && filters.consult_status !== "all") {
          params.consult_status = filters.consult_status;
        }

        const roleName = activeUser.role_name || (activeUser as any).role;
        if (roleName !== "관리자") {
          if (activeUser.id) params.tm_id = String(activeUser.id);
        } else {
          if (filters.tm_id && filters.tm_id !== "all") {
            params.tm_id = String(filters.tm_id);
          }
        }

        const queryParams = new URLSearchParams(params);
        const [cRes, uRes, codeRes] = await Promise.all([
          fetch(`/api/customers?${queryParams.toString()}`),
          fetch("/api/users"),
          fetch("/api/codes/details/by-group?group_code=CONSULT_STATUS"),
        ]);

        const cData = await cRes.json();
        const uData = await uRes.json();
        const codeData = await codeRes.json();

        const resultData = Array.isArray(cData) ? cData : cData.data || [];
        setCustomers(resultData);
        setTotalCount(cData.totalCount || resultData.length);
        setUsers(Array.isArray(uData) ? uData : []);
        setConsultCodes(
          Array.isArray(codeData)
            ? codeData.filter((c) => c.code_name !== "전체")
            : []
        );
      } catch (e) {
        console.error("데이터 로드 에러:", e);
        showToast("데이터 로드 실패", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, currentUser, currentPage, itemsPerPage, showToast]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        const roleName = parsedUser.role_name || parsedUser.role;
        if (roleName !== "관리자" && parsedUser.id) {
          setFilters((prev) => ({ ...prev, tm_id: String(parsedUser.id) }));
        }
        fetchData(parsedUser);
      } catch {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [
    filters.date_from,
    filters.date_to,
    filters.search,
    filters.tm_id,
    filters.consult_status,
    currentPage,
    itemsPerPage,
    fetchData,
    currentUser,
  ]);

  const fetchRecordings = async (customerId: string) => {
    setIsRecordingsLoading(true);
    try {
      const res = await fetch(`/api/recordings/upload?customer_id=${customerId}`);
      const data = await res.json();
      setRecordings(Array.isArray(data) ? data : []);
    } catch {
      setRecordings([]);
    } finally {
      setIsRecordingsLoading(false);
    }
  };

  const uploadRecordingFile = async (file: File, customerId: string) => {
    const body = new FormData();
    body.append("file", file);
    body.append("customer_id", customerId);

    const res = await fetch("/api/recordings/upload", {
      method: "POST",
      body,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || "녹취 파일 업로드 실패");
    }

    return data;
  };

  const confirmDeleteRecording = async () => {
    if (!recordingDeleteTarget) return;

    try {
      setIsDeletingRecording(true);
      const res = await fetch(`/api/recordings/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordingDeleteTarget.id }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "삭제 실패");
      }

      showToast("삭제되었습니다.");
      setIsRecordingDeleteModalOpen(false);
      setRecordingDeleteTarget(null);
      if (selectedCustomer) await fetchRecordings(selectedCustomer.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "삭제 실패", "error");
    } finally {
      setIsDeletingRecording(false);
    }
  };

  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setPendingRecordingFile(null);

    const baseDate =
      customer.consult_date && String(customer.consult_date).trim() !== ""
        ? customer.consult_date.replace("T", " ")
        : getDefaultConsultDate();

    setFormData({ ...customer, consult_date: baseDate });
    setRecordings([]);
    setIsModalOpen(true);
    await fetchRecordings(customer.id);
  };

  const openCreateModal = () => {
    if (!currentUser) return;

    setSelectedCustomer(null);
    setRecordings([]);
    setPendingRecordingFile(null);
    setFormData({
      customer_name: "",
      company_name: "",
      mobile_phone: "",
      landline_phone: "",
      address: "",
      note: "",
      receipt_date: getTodayDateString(),
      tm_id: isAdmin ? "" : String(currentUser.id),
      consult_date: getDefaultConsultDate(),
      consult_status: filters.consult_status !== "all" ? filters.consult_status : "대기",
      consult_memo: "",
    });
    setIsModalOpen(true);
  };

  const extractCreatedCustomerId = (data: any) => {
    return (
      data?.id ||
      data?.data?.id ||
      data?.customer?.id ||
      data?.data?.[0]?.id ||
      data?.[0]?.id ||
      null
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSaving) return;

    const companyName = String(formData.company_name || "").trim();
    if (!companyName) {
      showToast("업체명을 입력해주세요.", "error");
      return;
    }

    if (!selectedCustomer && !String(formData.tm_id || "").trim()) {
      showToast("상담사를 선택해주세요.", "error");
      return;
    }

    try {
      setIsSaving(true);

      if (selectedCustomer) {
        const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            company_name: companyName,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "저장 실패");
        }

        setIsModalOpen(false);
        showToast("정보가 저장되었습니다.");
        await fetchData();
        return;
      }

      const createPayload = {
        ...formData,
        company_name: companyName,
        tm_id: String(formData.tm_id || currentUser.id), // 신규 등록 시 관리자 선택값 또는 상담원 본인으로 배정
        receipt_date: formData.receipt_date || getTodayDateString(),
        consult_date: formData.consult_date || getDefaultConsultDate(),
        consult_status: formData.consult_status || "대기",
      };

      const createRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const createData = await createRes.json().catch(() => null);
      if (!createRes.ok) {
        throw new Error(createData?.error || "신규 고객 저장 실패");
      }

      const createdCustomerId = extractCreatedCustomerId(createData);

      if (pendingRecordingFile) {
        if (!createdCustomerId) {
          throw new Error("고객은 저장되었지만 고객 ID를 확인하지 못해 녹취 파일은 업로드하지 못했습니다.");
        }
        await uploadRecordingFile(pendingRecordingFile, String(createdCustomerId));
      }

      setIsModalOpen(false);
      setPendingRecordingFile(null);
      if (recordingInputRef.current) recordingInputRef.current.value = "";
      showToast(pendingRecordingFile ? "신규 고객과 녹취 파일이 저장되었습니다." : "신규 고객이 저장되었습니다.");
      await fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "저장 실패", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordingInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCustomer) {
      setPendingRecordingFile(file);
      showToast("녹취 파일이 선택되었습니다. 저장 시 함께 업로드됩니다.");
      return;
    }

    try {
      setIsUploading(true);
      await uploadRecordingFile(file, selectedCustomer.id);
      await fetchRecordings(selectedCustomer.id);
      showToast("업로드 성공");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "업로드 실패", "error");
    } finally {
      setIsUploading(false);
      if (recordingInputRef.current) recordingInputRef.current.value = "";
    }
  };

  const handleResetFilters = () => {
    if (!currentUser) return;
    const roleName = currentUser.role_name || (currentUser as any).role;
    setFilters({
      date_from: "",
      date_to: "",
      search: "",
      tm_id: roleName === "관리자" ? "all" : String(currentUser.id),
      consult_status: "대기",
    });
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => customers, [customers]);
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 md:space-y-8 pb-20 px-4 md:px-0 text-slate-900">
      <input
        ref={recordingInputRef}
        type="file"
        className="hidden"
        onChange={handleRecordingInputChange}
      />

      {toast && (
        <div
          className={`fixed right-6 top-6 z-[11000] flex items-center gap-3 rounded-[22px] border border-white/10 px-5 py-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-8 ${
            toast.type === "success"
              ? "bg-slate-900/90 text-white"
              : "bg-rose-600/90 text-white"
          }`}
        >
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        </div>
      )}

      {/* Header Area */}
      <section className="soft-scale-in">
        <div className="relative overflow-hidden rounded-[24px] md:rounded-[30px] border border-white/10 bg-slate-900 p-6 md:p-8 shadow-2xl">
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-200 uppercase">
                <Layers className="h-3 w-3" /> 상담 통합 관리
              </div>
              <h1 className="text-2xl md:text-[2.4rem] font-black text-white leading-tight">
                상담 관리
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-xs font-black text-white shadow-lg transition-all hover:bg-blue-500"
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                고객 추가
              </button>
              <button
                onClick={() => fetchData()}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20"
                type="button"
              >
                <RotateCw className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Area - Responsive Grid */}
      <section className="rounded-[24px] md:rounded-[28px] border border-white/60 bg-white/80 p-4 md:p-5 shadow-sm backdrop-blur-xl space-y-3">
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div className="hidden md:flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-black text-slate-500">
            <Filter className="h-3.5 w-3.5" /> 상담일자
          </div>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-[160px_auto_160px_1fr]">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters((p) => ({ ...p, date_from: e.target.value }))
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"
            />
            <div className="hidden md:flex items-center justify-center text-slate-300">
              ~
            </div>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters((p) => ({ ...p, date_to: e.target.value }))
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"
            />
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, search: e.target.value }))
                }
                placeholder="업체, 고객 검색"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-bold"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-[1fr_1fr_100px_auto]">
          <select
            disabled={
              (currentUser.role_name || (currentUser as any).role) !== "관리자"
            }
            value={filters.tm_id}
            onChange={(e) =>
              setFilters((p) => ({ ...p, tm_id: e.target.value }))
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none disabled:bg-slate-50"
          >
            {(currentUser.role_name || (currentUser as any).role) ===
            "관리자" ? (
              <>
                <option value="all">상담원 전체</option>
                {users
                  .filter((u) => u.role_name === "TM")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </>
            ) : (
              <option value={currentUser.id}>{currentUser.name}</option>
            )}
          </select>
          <select
            value={filters.consult_status}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                consult_status: e.target.value,
              }))
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"
          >
            {consultCodes.map((c) => (
              <option key={c.code_value} value={c.code_name}>
                {c.code_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleResetFilters}
            className="h-12 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
            type="button"
          >
            초기화
          </button>
          <div className="hidden md:flex h-12 items-center px-6 rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 mr-2" /> {totalCount}건
          </div>
        </div>
      </section>

      {/* Table Section - Responsive List/Table */}
      <section className="overflow-hidden rounded-[24px] md:rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
          <h2 className="text-sm md:text-lg font-black text-slate-900">
            상담 레지스트리
          </h2>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-black outline-none"
          >
            <option value={10}>10개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto p-8">
          <div className="min-w-[1400px] space-y-3">
            <div className="grid grid-cols-[160px_180px_150px_150px_150px_1fr_120px] gap-6 px-8 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="text-center">상담일시</span>
              <span>업체명</span>
              <span className="text-center">대표자</span>
              <span className="text-center">연락처</span>
              <span className="text-center">담당자</span>
              <span>상담 메모</span>
              <span className="text-center">상태</span>
            </div>
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-[24px] bg-slate-50 animate-pulse"
                  />
                ))
              : customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openModal(c)}
                    className="group grid grid-cols-[160px_180px_150px_150px_150px_1fr_120px] items-center gap-6 rounded-[24px] border border-slate-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl cursor-pointer text-slate-900"
                  >
                    <div className="text-center flex flex-col text-[11px] font-black">
                      <span>
                        {c.consult_date?.split("T")[0].replace(/-/g, ".")}
                      </span>
                      <span className="text-blue-500">
                        {c.consult_date?.split("T")[1]?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="truncate text-sm font-black">
                      {c.company_name}
                    </div>
                    <div className="text-center text-xs font-bold text-slate-600">
                      {c.customer_name}
                    </div>
                    <div className="text-center text-xs font-bold text-slate-600">
                      {c.mobile_phone}
                    </div>
                    <div className="text-center text-xs font-black text-blue-600">
                      {users.find((u) => u.id === c.tm_id)?.name || "미배정"}
                    </div>
                    <div className="line-clamp-1 text-xs text-slate-500">
                      {c.consult_memo || "기록 없음"}
                    </div>
                    <div className="flex justify-center">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600">
                        {c.consult_status}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Mobile View (Card List) */}
        <div className="md:hidden p-4 space-y-3">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-slate-50 animate-pulse"
                />
              ))
            : customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openModal(c)}
                  className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2 shadow-sm text-slate-900"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-black">{c.company_name}</div>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-black text-blue-600 border border-blue-100">
                      {c.consult_status}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>{c.customer_name}</span> | <span>{c.mobile_phone}</span>
                  </div>
                  <div className="text-[10px] font-black text-blue-500">
                    {c.consult_date?.replace("T", " ")}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1 bg-slate-50 p-2 rounded-lg">
                    {c.consult_memo || "메모 없음"}
                  </div>
                </div>
              ))}
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-6 md:px-10 py-6 md:py-8">
          <p className="hidden md:block text-sm font-bold text-slate-400">
            Total {totalCount} 건
          </p>
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="h-10 px-4 flex items-center rounded-xl bg-slate-900 text-xs font-black text-white">
              {currentPage} / {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              type="button"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* --- Detail/Create Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-slate-950/60 p-0 md:p-4 backdrop-blur-sm">
          <div className="relative flex h-[94vh] md:h-auto md:max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[40px] md:rounded-[40px] bg-white shadow-2xl text-slate-900">
            {isModalBusy && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col items-center rounded-[28px] border border-slate-200 bg-white/95 px-10 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-violet-500" />
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-violet-500 shadow-lg" />
                  </div>
                  <div className="mt-6 text-lg font-black tracking-[-0.03em] text-slate-900">
                    처리 중
                  </div>
                  <div className="mt-2 text-center text-sm font-semibold text-slate-500">
                    {modalLoadingMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h2 className="text-base font-black tracking-tight">
                  {isCreateMode ? "신규 고객 등록" : "상담 상세 설정"}
                </h2>
              </div>
              <button
                onClick={() => !isModalBusy && setIsModalOpen(false)}
                disabled={isModalBusy}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 disabled:opacity-50"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide"
            >
              {isCreateMode && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] font-bold text-blue-700">
                  {isAdmin ? "관리자는 신규 고객을 등록할 상담사를 선택해야 합니다." : <>신규 등록 시 상담사는 현재 로그인 사용자 <span className="font-black">{currentUser.name}</span>님으로 자동 배정됩니다.</>}
                </div>
              )}

              {isCreateMode && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                    상담사 <span className="text-rose-500">*</span>
                  </label>
                  {isAdmin ? (
                    <select
                      value={formData.tm_id || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          tm_id: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-xl border-2 border-blue-100 bg-blue-50/30 px-4 text-xs font-black text-blue-700 focus:border-blue-500 outline-none"
                    >
                      <option value="">상담사 선택</option>
                      {users
                        .filter((u) => u.role_name === "TM")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      value={currentUser.name}
                      disabled
                      className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-500 outline-none"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-slate-900">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                    업체명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={formData.company_name || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        company_name: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                    대표자
                  </label>
                  <input
                    value={formData.customer_name || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        customer_name: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tight">
                    유선 번호
                  </label>
                  <input
                    value={formData.landline_phone || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        landline_phone: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                    placeholder="유선 번호"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tight">
                    핸드폰 번호
                  </label>
                  <input
                    value={formData.mobile_phone || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        mobile_phone: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                    placeholder="핸드폰 번호"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> 상세 주소
                  </label>
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                    className="h-16 w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-900 outline-none resize-none shadow-inner"
                    placeholder="주소를 입력하세요."
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-800">
                  <Clock className="h-4 w-4 text-blue-500" /> 상담 일시 및 상태
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.consult_status || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        consult_status: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl border-2 border-blue-100 bg-blue-50/30 px-3 text-xs font-black text-blue-600 outline-none"
                  >
                    {consultCodes.map((c) => (
                      <option key={c.code_value} value={c.code_name}>
                        {c.code_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={
                      formData.consult_date
                        ? formData.consult_date.split(" ")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const time =
                        formData.consult_date?.split(" ")[1] || "09:00:00";
                      setFormData((p) => ({
                        ...p,
                        consult_date: `${e.target.value} ${time}`,
                      }));
                    }}
                    className="h-10 rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-slate-900 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={
                      formData.consult_date?.split(" ")[1]?.split(":")[0] ||
                      "09"
                    }
                    onChange={(e) => {
                      const d =
                        formData.consult_date?.split(" ")[0] ||
                        getTodayDateString();
                      const m =
                        formData.consult_date?.split(" ")[1]?.split(":")[1] ||
                        "00";
                      setFormData((p) => ({
                        ...p,
                        consult_date: `${d} ${e.target.value}:${m}:00`,
                      }));
                    }}
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-900 text-center"
                  >
                    {hoursList.map((h) => (
                      <option key={h} value={h}>
                        {h}시
                      </option>
                    ))}
                  </select>
                  <select
                    value={
                      formData.consult_date?.split(" ")[1]?.split(":")[1] ||
                      "00"
                    }
                    onChange={(e) => {
                      const d =
                        formData.consult_date?.split(" ")[0] ||
                        getTodayDateString();
                      const h =
                        formData.consult_date?.split(" ")[1]?.split(":")[0] ||
                        "09";
                      setFormData((p) => ({
                        ...p,
                        consult_date: `${d} ${h}:${e.target.value}:00`,
                      }));
                    }}
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-900 text-center"
                  >
                    {minutesList.map((m) => (
                      <option key={m} value={m}>
                        {m}분
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                  상담 기록
                </label>
                <textarea
                  value={formData.consult_memo || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      consult_memo: e.target.value,
                    }))
                  }
                  className="h-20 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-900 outline-none resize-none"
                  placeholder="내용을 기록하세요."
                />
              </div>

              <div className="rounded-2xl border-2 border-dashed border-emerald-100 bg-emerald-50/20 p-4 text-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1.5">
                    <FileAudio className="h-4 w-4" /> 녹취 파일
                  </span>
                  <button
                    type="button"
                    onClick={() => recordingInputRef.current?.click()}
                    disabled={isModalBusy}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" /> 파일 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-[80px] overflow-y-auto pr-1">
                  {isCreateMode && pendingRecordingFile ? (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-700 truncate flex-1 mr-2">
                        {pendingRecordingFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRecordingFile(null);
                          if (recordingInputRef.current) recordingInputRef.current.value = "";
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : isRecordingsLoading ? (
                    <div className="h-10 rounded-xl bg-white animate-pulse" />
                  ) : recordings.length === 0 ? (
                    <div className="text-center py-2 text-[10px] font-bold text-slate-300">
                      첨부 파일 없음
                    </div>
                  ) : (
                    recordings.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200"
                      >
                        <span className="text-[10px] font-bold text-slate-700 truncate flex-1 mr-2">
                          {r.file_name}
                        </span>
                        <div className="flex gap-1">
                          <a
                            href={r.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingDeleteTarget(r);
                              setIsRecordingDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {isCreateMode && pendingRecordingFile && (
                  <p className="mt-2 text-[10px] font-bold text-emerald-700">
                    신규 고객 저장 시 선택한 녹취 파일도 함께 업로드됩니다.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1 pb-4 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isModalBusy}
                  className="h-12 flex-1 rounded-2xl border-2 border-slate-200 font-black text-slate-400 text-xs disabled:opacity-50"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={isModalBusy || !String(formData.company_name || "").trim() || (isCreateMode && !String(formData.tm_id || "").trim())}
                  className="h-12 flex-[2] rounded-2xl bg-slate-900 font-black text-white text-xs shadow-xl disabled:opacity-50"
                >
                  {isCreateMode ? "신규 고객 저장" : "변경 내용 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recording Delete Modal */}
      {isRecordingDeleteModalOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-6 text-slate-900">
          <div className="w-full max-w-[280px] rounded-[30px] bg-white p-6 text-center shadow-2xl border border-slate-100">
            <h3 className="text-sm font-black">파일을 삭제할까요?</h3>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={confirmDeleteRecording}
                disabled={isDeletingRecording}
                className="h-11 rounded-xl bg-rose-600 text-xs font-black text-white disabled:opacity-50"
                type="button"
              >
                {isDeletingRecording ? "삭제 중..." : "삭제"}
              </button>
              <button
                onClick={() => {
                  setIsRecordingDeleteModalOpen(false);
                  setRecordingDeleteTarget(null);
                }}
                disabled={isDeletingRecording}
                className="h-11 rounded-xl font-bold text-slate-400 text-xs disabled:opacity-50"
                type="button"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
