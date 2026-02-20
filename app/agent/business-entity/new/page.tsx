"use client";

import { useState, useEffect, FormEvent } from "react";

interface BusinessEntity {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: string | null;
  createdAt: string;
}

export default function BusinessEntityNewPage() {
  // 폼 상태
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<
    "INDIVIDUAL" | "CORPORATION"
  >("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 목록 상태
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // 목록 조회
  const fetchEntities = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/agent/business-entity");
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
      }
    } catch {
      console.error("목록 조회 실패");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  // 사업자번호 포맷팅 (XXX-XX-XXXXX)
  const formatBusinessNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleBusinessNumberChange = (value: string) => {
    setBusinessNumber(formatBusinessNumber(value));
  };

  // 폼 제출
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/business-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber,
          businessType,
          businessName: businessName || null,
          representativeName: representativeName || null,
          openingDate: openingDate || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "사업자가 등록되었습니다." });
        // 폼 초기화
        setBusinessNumber("");
        setBusinessType("INDIVIDUAL");
        setBusinessName("");
        setRepresentativeName("");
        setOpeningDate("");
        // 목록 새로고침
        fetchEntities();
      } else {
        setMessage({
          type: "error",
          text: data.error || "등록에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">사업자 등록</h1>

      {/* 등록 폼 */}
      <form
        onSubmit={handleSubmit}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 space-y-5"
      >
        {/* 사업자번호 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            사업자번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={businessNumber}
            onChange={(e) => handleBusinessNumberChange(e.target.value)}
            placeholder="000-00-00000"
            maxLength={12}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 사업자구분 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            사업자구분 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="businessType"
                value="INDIVIDUAL"
                checked={businessType === "INDIVIDUAL"}
                onChange={() => setBusinessType("INDIVIDUAL")}
                className="accent-blue-500"
              />
              <span className="text-sm">개인</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="businessType"
                value="CORPORATION"
                checked={businessType === "CORPORATION"}
                onChange={() => setBusinessType("CORPORATION")}
                className="accent-blue-500"
              />
              <span className="text-sm">법인</span>
            </label>
          </div>
        </div>

        {/* 상호명 */}
        <div>
          <label className="block text-sm font-medium mb-1">상호명</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="상호명"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 대표자명 */}
        <div>
          <label className="block text-sm font-medium mb-1">대표자명</label>
          <input
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            placeholder="대표자 이름"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 개업일 */}
        <div>
          <label className="block text-sm font-medium mb-1">개업일</label>
          <input
            type="date"
            value={openingDate}
            onChange={(e) => setOpeningDate(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 메시지 */}
        {message && (
          <div
            className={`text-sm px-3 py-2 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>

      {/* 등록된 사업자 목록 */}
      <h2 className="text-lg font-semibold mb-3">등록된 사업자 목록</h2>

      {listLoading ? (
        <p className="text-sm text-gray-500">로딩 중...</p>
      ) : entities.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 사업자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium">사업자번호</th>
                <th className="text-left py-2 px-3 font-medium">구분</th>
                <th className="text-left py-2 px-3 font-medium">상호명</th>
                <th className="text-left py-2 px-3 font-medium">대표자명</th>
                <th className="text-left py-2 px-3 font-medium">개업일</th>
                <th className="text-left py-2 px-3 font-medium">등록일</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr
                  key={entity.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-2 px-3 font-mono">
                    {formatBusinessNumber(entity.businessNumber)}
                  </td>
                  <td className="py-2 px-3">
                    {entity.businessType === "INDIVIDUAL" ? "개인" : "법인"}
                  </td>
                  <td className="py-2 px-3">{entity.businessName || "-"}</td>
                  <td className="py-2 px-3">
                    {entity.representativeName || "-"}
                  </td>
                  <td className="py-2 px-3">
                    {entity.openingDate
                      ? new Date(entity.openingDate).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(entity.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
