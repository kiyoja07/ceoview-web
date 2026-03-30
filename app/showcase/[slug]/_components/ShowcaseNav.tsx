"use client";

import { useState } from "react";

const tabs = [
  { href: "#agent", label: "세무대리인" },
  { href: "#salary-upload", label: "급여 등록" },
  { href: "#company", label: "회사 관리자" },
  { href: "#salary", label: "급여 지급 현황" },
  { href: "#salary-earned", label: "근로소득 상세" },
  { href: "#employee", label: "직원 포털" },
  { href: "#payslip", label: "명세서 상세" },
  { href: "#payslip-delivery", label: "명세서 전송" },
];

export default function ShowcaseNav() {
  const [active, setActive] = useState("#agent");

  return (
    <nav className="sticky top-[4.5rem] z-10 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur">
      {tabs.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          onClick={() => setActive(tab.href)}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            active === tab.href
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
