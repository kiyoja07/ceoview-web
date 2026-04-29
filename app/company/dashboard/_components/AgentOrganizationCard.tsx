import type { FormEvent } from "react";
import type {
  CompanyAgentSignupRequestHistory,
  CompanyDashboardResponse,
} from "@/types/company/dashboard";
import type { InviteContactType, InviteResult } from "./types";

type AgentOrganizationCardProps = {
  agentOrganization: CompanyDashboardResponse["agentOrganization"];
  signupRequestHistories: CompanyAgentSignupRequestHistory[];
  agentLabel: string;
  inviteOpen: boolean;
  inviteContactType: InviteContactType;
  inviteContact: string;
  inviteSending: boolean;
  inviteResult: InviteResult | null;
  onToggleInvite: () => void;
  onInviteContactTypeChange: (contactType: InviteContactType) => void;
  onInviteContactChange: (contact: string) => void;
  onSendInvite: (event: FormEvent<HTMLFormElement>) => void;
};

export function AgentOrganizationCard({
  agentOrganization,
  signupRequestHistories,
  agentLabel,
  inviteOpen,
  inviteContactType,
  inviteContact,
  inviteSending,
  inviteResult,
  onToggleInvite,
  onInviteContactTypeChange,
  onInviteContactChange,
  onSendInvite,
}: AgentOrganizationCardProps) {
  const hasSignupRequestHistories = signupRequestHistories.length > 0;

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">세무대리인</p>

          {agentOrganization ? (
            <>
              <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                {agentLabel}
              </p>
              {agentOrganization.phone && (
                <p className="mt-1 text-sm text-gray-500">
                  전화번호 {agentOrganization.phone}
                </p>
              )}
              {agentOrganization.representativeName && (
                <p className="mt-1 text-sm text-gray-500">
                  대표자 {agentOrganization.representativeName}
                </p>
              )}
            </>
          ) : (
            <div className="mt-2 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9 9 0 1 0-12 0M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    담당 세무대리인이 없습니다
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    세무대리인이 경영한눈에 가입하면 자동으로 연결됩니다
                  </p>
                </div>
              </div>

              {!inviteOpen ? (
                <button
                  type="button"
                  onClick={onToggleInvite}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                  가입 요청 보내기
                </button>
              ) : (
                <form
                  onSubmit={(event) => onSendInvite(event)}
                  className="max-w-md rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      가입 요청 보내기
                    </p>
                    <button
                      type="button"
                      onClick={onToggleInvite}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19 9-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-3 flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
                    {(["email", "phone"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onInviteContactTypeChange(type)}
                        className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
                          inviteContactType === type
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {type === "email" ? "이메일" : "문자"}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <label htmlFor="agent-signup-contact" className="sr-only">
                      {inviteContactType === "email"
                        ? "세무사무소 이메일"
                        : "세무사무소 휴대폰 번호"}
                    </label>
                    <input
                      id="agent-signup-contact"
                      type={inviteContactType === "email" ? "email" : "tel"}
                      value={inviteContact}
                      onChange={(event) =>
                        onInviteContactChange(event.target.value)
                      }
                      placeholder={
                        inviteContactType === "email"
                          ? "세무사무소 이메일"
                          : "휴대폰 번호 (01012345678)"
                      }
                      required
                      disabled={inviteSending}
                      className="min-h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                    <button
                      type="submit"
                      disabled={inviteSending || !inviteContact.trim()}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {inviteSending ? "전송 중..." : "전송"}
                    </button>
                  </div>

                  {inviteResult && (
                    <div
                      className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
                        inviteResult.ok
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {inviteResult.ok ? (
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                          />
                        </svg>
                      )}
                      {inviteResult.message}
                    </div>
                  )}
                </form>
              )}

              {hasSignupRequestHistories && (
                <div className="max-w-md rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <p className="text-sm font-semibold text-gray-700">
                    가입 요청 이력
                  </p>
                  <div className="mt-3 divide-y divide-gray-200">
                    {signupRequestHistories.map((history) => (
                      <div
                        key={history.id}
                        className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-700">
                            {history.contact}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatSignupRequestDate(history.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
                          {history.contactType === "email" ? "이메일" : "문자"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSignupRequestDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
