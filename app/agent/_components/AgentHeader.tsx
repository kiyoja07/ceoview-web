"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMON_ACTION_LABELS } from "@/catalogs/ko/common";
import { AGENT_HEADER_NAV_ITEMS } from "@/catalogs/ko/navigation";
import type { HeaderProfile } from "@/types/agent/header";

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function formatOrganizationNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function AgentHeader() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<HeaderProfile | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/agent/auth")) return;

    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as HeaderProfile;
        if (mounted) {
          setProfile({
            name: data.name,
            email: data.email,
            organization: data.organization,
          });
        }
      } catch {
        // 헤더 표시는 보조 정보이므로 조회 실패 시 무시
      }
    };

    void fetchProfile();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/agent/auth")) {
    return null;
  }

  const organizationLabel = profile?.organization?.organizationName
    ? profile.organization.organizationName
    : profile?.organization?.organizationNumber
      ? formatOrganizationNumber(profile.organization.organizationNumber)
      : "소속 미등록";
  const navItems = AGENT_HEADER_NAV_ITEMS.filter(
    (item): item is typeof item & { href: string } =>
      typeof item.href === "string",
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-700 bg-agent-header backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/agent/company"
          className="shrink-0 text-sm font-semibold tracking-tight text-white"
        >
          {organizationLabel}
        </Link>

        <nav className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-2">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden gap-4 flex-row rounded-lg border border-gray-500/40 bg-white/10 px-3 py-1.5 text-right md:flex">
            <p className="text-xs text-gray-300">
              {profile?.email || organizationLabel}
            </p>
            <p className="text-xs font-medium text-white">
              {profile?.name || "사용자"}
            </p>
          </div>
          <Link
            href="/agent/auth/logout"
            className="shrink-0 rounded-lg border border-gray-500/40 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-white/10"
          >
            {COMMON_ACTION_LABELS.logout}
          </Link>
        </div>
      </div>
    </header>
  );
}
