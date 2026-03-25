export default function FooterSection() {
  return (
    <footer className="border-t border-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="https://ceoview.edge.naverncp.com/public/app-icon-ceoview.png"
              alt="경영한눈"
              className="h-6 w-6 rounded-md"
            />
            <span className="text-sm font-semibold tracking-wide text-slate-400">
              경영한눈
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} 경영한눈. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
