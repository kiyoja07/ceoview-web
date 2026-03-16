"use client";

import { useCallback } from "react";
import Script from "next/script";

export type AddressValue = {
  zipcode: string;
  address: string;
  addressDetail: string;
};

type AddressInputProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
  /** 포커스 링 색상 테마 (기본: emerald) */
  theme?: "emerald" | "blue";
};

const baseInput =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow";
const readOnlyInput =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

const themeRing = {
  emerald: "focus:ring-emerald-500",
  blue: "focus:ring-blue-500",
} as const;

const themeBtnBg = {
  emerald: "bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300",
  blue: "bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300",
} as const;

export default function AddressInput({
  value,
  onChange,
  disabled = false,
  theme = "emerald",
}: AddressInputProps) {
  const openPostcodePopup = useCallback(() => {
    if (disabled) return;
    const daum = (
      window as unknown as {
        daum?: {
          Postcode: new (opts: {
            oncomplete: (data: {
              zonecode: string;
              address: string;
              roadAddress: string;
              jibunAddress: string;
              userSelectedType: string;
            }) => void;
          }) => { open: () => void };
        };
      }
    ).daum;
    if (!daum) return;
    new daum.Postcode({
      oncomplete(data) {
        const newAddress =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        onChange({
          zipcode: data.zonecode,
          address: newAddress,
          addressDetail: "",
        });
        setTimeout(() => {
          document.getElementById("addressDetail")?.focus();
        }, 100);
      },
    }).open();
  }, [disabled, onChange]);

  const ring = themeRing[theme];

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <div className="space-y-3">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          주소
        </label>

        {/* 우편번호 + 검색 버튼 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={value.zipcode}
            readOnly
            placeholder="우편번호"
            className={`${baseInput} max-w-35 ${readOnlyInput}`}
          />
          <button
            type="button"
            onClick={openPostcodePopup}
            disabled={disabled}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed ${themeBtnBg[theme]}`}
          >
            주소 검색
          </button>
        </div>

        {/* 기본주소 (읽기전용) */}
        <input
          type="text"
          value={value.address}
          readOnly
          placeholder="주소 검색을 눌러 주소를 입력하세요"
          className={`${baseInput} ${readOnlyInput}`}
        />

        {/* 상세주소 */}
        <input
          id="addressDetail"
          type="text"
          value={value.addressDetail}
          onChange={(e) =>
            onChange({ ...value, addressDetail: e.target.value })
          }
          placeholder="상세주소를 입력하세요"
          className={`${baseInput} ${ring}`}
          disabled={disabled}
        />
      </div>
    </>
  );
}
