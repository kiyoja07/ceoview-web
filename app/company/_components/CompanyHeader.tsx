"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  CompanyHeaderNavItem,
  CompanyHeaderProfile,
} from "@/types/company/header";

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function CompanyHeader() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<CompanyHeaderProfile | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/company/auth") || pathname === "/company") return;

    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok || !mounted) return;

        const data = (await res.json()) as {
          name: string;
          email: string;
          company: {
            id: string;
            businessName: string | null;
            businessNumber: string;
          } | null;
        };

        if (!mounted) return;
        setProfile({
          name: data.name,
          email: data.email,
          company: data.company,
        });
      } catch {
        // 헤더 보조 정보 조회 실패 시 무시
      }
    };

    void fetchProfile();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/company/auth") || pathname === "/company") {
    return null;
  }

  const salaryHref = profile?.company?.id
    ? `/company/${profile.company.id}/salary`
    : "/company/dashboard";

  const navItems: CompanyHeaderNavItem[] = [
    { href: "/company/dashboard", label: "대시보드" },
    { href: salaryHref, label: "급여" },
    { href: "/company/organization/profile", label: "계정" },
    { href: "/company/billing", label: "결제" },
  ];

  const companyLabel = profile?.company
    ? profile.company.businessName ||
      formatBusinessNumber(profile.company.businessNumber)
    : "Company Console";

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-emerald-900 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/company/dashboard"
          className="shrink-0 text-sm font-semibold tracking-tight text-white"
        >
          {companyLabel}
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
                        ? "bg-white/20 text-white"
                        : "text-emerald-100 hover:bg-white/10 hover:text-white"
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
          <div className="hidden gap-4 flex-row rounded-lg border border-emerald-700/40 bg-white/10 px-3 py-1.5 text-right md:flex">
            <p className="text-xs text-emerald-100">{profile?.email || ""}</p>
            <p className="text-xs font-medium text-white">
              {profile?.name || "사용자"}
            </p>
          </div>
          <Link
            href="/company/auth/logout"
            className="shrink-0 rounded-lg border border-emerald-700/40 px-3 py-1.5 text-sm font-medium text-emerald-100 transition hover:bg-white/10 hover:text-white"
          >
            로그아웃
          </Link>
        </div>
      </div>
    </header>
  );
}
