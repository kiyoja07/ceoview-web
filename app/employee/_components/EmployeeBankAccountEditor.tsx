"use client";

import { useCallback, useEffect, useState } from "react";
import BankAccountInput, {
  type BankAccountValue,
} from "@/app/_components/BankAccountInput";

// 계좌 목록 조회. 실패하면 null을 반환한다.
async function fetchBankAccounts(): Promise<BankAccountValue[] | null> {
  try {
    const res = await fetch("/api/employee/bank-account");
    if (!res.ok) return null;
    const data = await res.json();
    return (data.accounts ?? []).map(
      (a: {
        id: string;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
      }) => ({
        id: a.id,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        accountHolder: a.accountHolder,
      }),
    );
  } catch {
    return null;
  }
}

export default function EmployeeBankAccountEditor() {
  const [accounts, setAccounts] = useState<BankAccountValue[]>([]);
  const [original, setOriginal] = useState<BankAccountValue[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // 조회 결과 반영(실패 시 기존 값 유지)
  const applyAccounts = useCallback((fetched: BankAccountValue[] | null) => {
    if (fetched) {
      setAccounts(fetched);
      setOriginal(fetched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchBankAccounts().then((fetched) => {
      if (!cancelled) applyAccounts(fetched);
    });
    return () => {
      cancelled = true;
    };
  }, [applyAccounts]);

  function handleCancel() {
    setAccounts(original);
    setEditing(false);
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/employee/bank-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "저장에 실패했습니다.",
        });
        return;
      }
      setMessage({ type: "success", text: "계좌 정보가 저장되었습니다." });
      setEditing(false);
      applyAccounts(await fetchBankAccounts());
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="py-2 text-sm text-gray-400">계좌 정보를 불러오는 중…</p>
    );
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 계좌가 없습니다.</p>
        ) : (
          accounts.map((a, i) => (
            <div
              key={a.id ?? i}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {a.bankName}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {a.accountNumber} · {a.accountHolder}
                </p>
              </div>
            </div>
          ))
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {accounts.length === 0 ? "계좌 등록" : "계좌 수정"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <BankAccountInput
        value={accounts}
        onChange={setAccounts}
        disabled={saving}
        theme="blue"
        maxCount={1}
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
