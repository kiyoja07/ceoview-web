"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBusinessNumber } from "@/app/lib/formatters";
import { COMMON_ACTION_LABELS } from "@/catalogs/ko/common";
import { COMPANY_HEADER_NAV_ITEMS } from "@/catalogs/ko/navigation";
import type { CompanyHeaderProfile } from "@/types/company/header";

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function CompanyHeader() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<CompanyHeaderProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

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
    const handleCompanySelectionChanged = () => {
      void fetchProfile();
    };
    window.addEventListener(
      "company-selection-changed",
      handleCompanySelectionChanged,
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "company-selection-changed",
        handleCompanySelectionChanged,
      );
    };
  }, [pathname]);

  if (pathname.startsWith("/company/auth") || pathname === "/company") {
    return null;
  }

  const salaryHref = profile?.company?.id
    ? `/company/${profile.company.id}/salary/dashboard`
    : "/company/dashboard";

  const navItems = COMPANY_HEADER_NAV_ITEMS.map((item) =>
    item.slug === "salary" ? { ...item, href: salaryHref } : item,
  ).filter(
    (item): item is typeof item & { href: string } =>
      typeof item.href === "string",
  );

  const companyLabel = profile?.company
    ? profile.company.businessName ||
      formatBusinessNumber(profile.company.businessNumber)
    : "급여 관리 시스템";

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-emerald-900 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/company/dashboard"
          className="shrink-0 text-sm font-semibold tracking-tight text-white"
        >
          {companyLabel}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-w-0 flex-1 overflow-x-auto md:block">
          <ul className="flex min-w-max items-center gap-2">
            {navItems.map((item) => {
              const active = item.activePrefix
                ? pathname.startsWith(item.activePrefix)
                : isActivePath(pathname, item.href);
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
            className="hidden shrink-0 rounded-lg border border-emerald-700/40 px-3 py-1.5 text-sm font-medium text-emerald-100 transition hover:bg-white/10 hover:text-white md:inline-flex"
          >
            {COMMON_ACTION_LABELS.logout}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-emerald-100 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="메뉴 열기"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-emerald-800/60 bg-emerald-900 px-4 pb-3 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = item.activePrefix
                ? pathname.startsWith(item.activePrefix)
                : isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
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
          <div className="mt-2 flex items-center justify-between border-t border-emerald-800/60 pt-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {profile?.name || "사용자"}
              </p>
              <p className="truncate text-xs text-emerald-300">
                {profile?.email || ""}
              </p>
            </div>
            <Link
              href="/company/auth/logout"
              className="shrink-0 rounded-lg border border-emerald-700/40 px-3 py-1.5 text-sm font-medium text-emerald-100 transition hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
