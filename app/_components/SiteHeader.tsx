import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export default function SiteHeader({
  navItems,
  sticky = false,
}: {
  navItems: NavItem[];
  sticky?: boolean;
}) {
  return (
    <header
      className={`border-b border-slate-200 bg-white/90 backdrop-blur ${sticky ? "sticky top-0 z-20" : ""}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="https://ceoview.edge.naverncp.com/public/app-icon-ceoview.png"
            alt="경영한눈"
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-base font-bold tracking-wide text-slate-950">
            경영한눈
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {navItems.map((item) =>
            item.variant === "secondary" ? (
              <Link
                key={item.label}
                href={item.href}
                className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:inline-flex"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}
