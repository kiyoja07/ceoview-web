"use client";

import { useState } from "react";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";
import { formatEmployeePhone } from "@/app/lib/employee-contact";

type ProfileData = {
  email: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
};

type Props = {
  initial: ProfileData;
};

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

export default function EmployeeProfileEditor({ initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: initial.zipcode,
    address: initial.address,
    addressDetail: initial.addressDetail,
  });

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, "").slice(0, 11));
  }

  function handleCancel() {
    setEmail(initial.email);
    setPhone(initial.phone);
    setAddressValue({
      zipcode: initial.zipcode,
      address: initial.address,
      addressDetail: initial.addressDetail,
    });
    setEditing(false);
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          zipcode: addressValue.zipcode,
          address: addressValue.address,
          addressDetail: addressValue.addressDetail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "저장에 실패했습니다.",
        });
        return;
      }
      setMessage({ type: "success", text: "프로필이 수정되었습니다." });
      setEditing(false);
      // Update initial values to edited values by reloading
      window.location.reload();
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            이메일
          </p>
          <p className="mt-1 text-gray-900">{initial.email || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            휴대폰번호
          </p>
          <p className="mt-1 text-gray-900">
            {initial.phone ? formatEmployeePhone(initial.phone) : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            주소
          </p>
          <p className="mt-1 text-gray-900">
            {[initial.zipcode, initial.address, initial.addressDetail]
              .filter(Boolean)
              .join(" ") || "-"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          수정하기
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력하세요"
          className={inputBase}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          휴대폰번호
        </label>
        <input
          type="tel"
          value={phone ? formatEmployeePhone(phone) : ""}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="휴대폰번호를 입력하세요"
          className={inputBase}
        />
      </div>

      <AddressInput
        value={addressValue}
        onChange={setAddressValue}
        theme="blue"
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
