"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CompanyFeatureFlags } from "@/types/company/features";

type MessageState = { type: "success" | "error"; text: string } | null;

type FeatureItem = {
  key: keyof CompanyFeatureFlags;
  label: string;
  description: string;
};

const FEATURE_ITEMS: FeatureItem[] = [
  {
    key: "financialReport",
    label: "재무리포트",
    description:
      "거래처가 회계연도별 수익·비용 요약과 재무 리포트를 조회할 수 있습니다.",
  },
  {
    key: "salary",
    label: "인건비 · 직원 관리",
    description:
      "거래처가 월별 인건비 내역과 지급 대상자(직원) 현황을 조회·관리할 수 있습니다.",
  },
];

export default function CompanyFeaturesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const companyId = params?.id;

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<CompanyFeatureFlags>({
    salary: true,
    financialReport: true,
  });
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    if (!companyId) return;

    const loadFeatures = async () => {
      try {
        const res = await fetch(`/api/agent/company/${companyId}/features`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setMessage({
            type: "error",
            text: data?.error || "제공 기능을 불러오지 못했습니다.",
          });
          return;
        }

        const data = (await res.json()) as { features: CompanyFeatureFlags };
        setFeatures(data.features);
      } catch {
        setMessage({
          type: "error",
          text: "제공 기능을 불러오지 못했습니다.",
        });
      } finally {
        setChecking(false);
      }
    };

    void loadFeatures();
  }, [companyId, router]);

  const persist = async (next: CompanyFeatureFlags) => {
    if (!companyId) return;

    const previous = features;
    setFeatures(next);
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/agent/company/${companyId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        features?: CompanyFeatureFlags;
        error?: string;
      } | null;

      if (!res.ok) {
        setFeatures(previous);
        setMessage({
          type: "error",
          text: data?.error || "제공 기능 저장에 실패했습니다.",
        });
        return;
      }

      if (data?.features) {
        setFeatures(data.features);
      }
      setMessage({ type: "success", text: "제공 기능이 저장되었습니다." });
    } catch {
      setFeatures(previous);
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof CompanyFeatureFlags) => {
    void persist({ ...features, [key]: !features[key] });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-sm text-gray-500">제공 기능 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            제공 기능 관리
          </h1>
          <p className="text-sm text-gray-500">
            이 거래처에 노출할 기능을 선택합니다. 끈 기능은 거래처의 대시보드와
            메뉴에서 숨겨집니다.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          {FEATURE_ITEMS.map((item) => {
            const enabled = features[item.key];
            return (
              <div
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${item.label} 제공`}
                  disabled={saving}
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
