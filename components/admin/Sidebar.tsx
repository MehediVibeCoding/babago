"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "মূল একাডেমি ব্যবস্থাপনা",
    items: [
      {
        href: "/",
        label: "ড্যাশবোর্ড",
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </>
        ),
      },
      {
        href: "/students",
        label: "শিক্ষার্থী",
        icon: (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        href: "/payments",
        label: "বেতন / পেমেন্ট",
        icon: (
          <>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </>
        ),
      },
      {
        href: "/batches",
        label: "ব্যাচ ম্যানেজমেন্ট",
        icon: (
          <>
            <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" />
            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
          </>
        ),
      },
      {
        href: "/class-diary",
        label: "ক্লাস ডায়েরি",
        icon: (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        ),
      },
      {
        href: "/blog",
        label: "ব্লগ ও আর্টিকেল",
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </>
        ),
      },
      {
        href: "/expenses",
        label: "আয়-ব্যয় ও ফাইন্যান্স",
        icon: (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        ),
      },
    ],
  },
  {
    title: "ওয়েবসাইট কনটেন্ট ও মিডিয়া",
    items: [
      {
        href: "/gallery/classroom",
        label: "ক্লাসরুম গ্যালারি",
        icon: (
          <>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </>
        ),
      },
      {
        href: "/gallery/memories",
        label: "বিদায় ও স্মৃতি অ্যালবাম",
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        ),
      },
      {
        href: "/toppers",
        label: "কৃতি শিক্ষার্থী দেয়াল",
        icon: (
          <>
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </>
        ),
      },
      {
        href: "/videos",
        label: "ভিডিও লেকচার",
        icon: (
          <>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </>
        ),
      },
      {
        href: "/reviews",
        label: "রিভিউ ও মতামত",
        icon: (
          <>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </>
        ),
      },
    ],
  },
  {
    title: "সিস্টেম",
    items: [
      {
        href: "/settings",
        label: "সেটিংস",
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ),
      },
    ],
  },
];

// মোবাইল বটম বারের ৪টি মূল শর্টকাট
const BOTTOM_TAB_ITEMS = [
  NAV_SECTIONS[0].items[0], // ড্যাশবোর্ড
  NAV_SECTIONS[0].items[1], // শিক্ষার্থী
  NAV_SECTIONS[0].items[2], // পেমেন্ট
  NAV_SECTIONS[0].items[6], // আয়-ব্যয় ও ফাইন্যান্স
];

function NavIcon({ children, className = "h-[18px] w-[18px]" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0`}
    >
      {children}
    </svg>
  );
}

function LogoMark({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)]">
        <span className="font-display text-[19px] font-bold">A</span>
      </div>
      <div
        className={cn(
          "min-w-0 transition-all duration-300",
          isExpanded ? "w-auto translate-x-0 opacity-100" : "w-0 -translate-x-3 overflow-hidden opacity-0"
        )}
      >
        <span className="block font-body text-[14.5px] font-black leading-tight tracking-tight text-sky-950">
          Ahsan&apos;s Academy
        </span>
        <span className="block font-body text-[9px] font-bold uppercase tracking-[1.8px] text-sky-600">
          Admin Suite
        </span>
      </div>
    </div>
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      {/* ══ ডেস্কটপ এক্সপ্যান্ডেবল গ্লাস সাইডবার (০ms ইনস্ট্যান্ট প্রি-ফেচিং সহ) ══ */}
      <div className="relative hidden md:block md:w-[76px] md:shrink-0">
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "fixed left-3 top-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white/80 shadow-[0_8px_32px_rgba(2,132,199,0.12)] backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
            isHovered ? "w-[260px] bg-white/95 shadow-[0_14px_45px_rgba(2,132,199,0.18)]" : "w-[72px]"
          )}
        >
          <div className="flex h-16 items-center px-4 pt-1">
            <LogoMark isExpanded={isHovered} />
          </div>

          <nav className="sleek-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="mb-2">
                <div
                  className={cn(
                    "px-3 py-1 font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted/70 transition-all duration-200",
                    isHovered ? "h-auto opacity-100" : "h-0 overflow-hidden py-0 opacity-0"
                  )}
                >
                  {section.title}
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        title={!isHovered ? item.label : undefined}
                        className={cn(
                          "group relative flex h-[42px] items-center rounded-[14px] transition-all duration-brand",
                          isHovered ? "justify-start gap-3 px-3.5" : "justify-center px-0",
                          active
                            ? "bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-sh2"
                            : "text-ink-800/70 hover:bg-sky-100/60 hover:text-sky-700"
                        )}
                      >
                        <NavIcon className={cn("h-5 w-5", active ? "text-white" : "text-ink-800/65 group-hover:text-sky-700")}>
                          {item.icon}
                        </NavIcon>
                        <span
                          className={cn(
                            "whitespace-nowrap font-body text-[13px] font-bold tracking-tight transition-all duration-200",
                            isHovered ? "w-auto opacity-100" : "w-0 overflow-hidden opacity-0"
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border-base/60 p-2.5">
            <form action={logout}>
              <button
                type="submit"
                title={!isHovered ? "লগআউট" : undefined}
                className={cn(
                  "group flex h-[42px] w-full items-center rounded-[14px] font-body text-[12.5px] font-bold text-danger/80 transition-all duration-brand hover:bg-rose-50 hover:text-danger",
                  isHovered ? "justify-start gap-3 px-3.5" : "justify-center px-0"
                )}
              >
                <NavIcon className="h-5 w-5 text-danger/70 group-hover:text-danger">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </NavIcon>
                <span className={cn("whitespace-nowrap transition-all duration-200", isHovered ? "w-auto opacity-100" : "w-0 overflow-hidden opacity-0")}>
                  লগআউট
                </span>
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* ══ মোবাইল ফ্রস্টেড বটম বার (ইনস্ট্যান্ট প্রাক-লোড সহ) ══ */}
      <div
        className="fixed bottom-3 left-1/2 z-[500] flex w-[calc(100%-20px)] max-w-[420px] -translate-x-1/2 items-center justify-between rounded-full border border-white/80 bg-white/90 p-1.5 shadow-[0_8px_32px_rgba(2,132,199,0.18)] backdrop-blur-2xl md:hidden"
        style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
      >
        {BOTTOM_TAB_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-brand",
                active ? "bg-sky-600 text-white shadow-xs" : "text-ink-800/65 hover:text-sky-700"
              )}
            >
              <NavIcon className="h-[18px] w-[18px]">{item.icon}</NavIcon>
              <span className="font-body text-[8.5px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-ink-800/65 transition-all duration-brand hover:text-sky-700"
        >
          <NavIcon className="h-[18px] w-[18px]">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </NavIcon>
          <span className="font-body text-[8.5px] font-bold">মেনু</span>
        </button>
      </div>

      {/* ══ মোবাইল স্লাইড-আপ ড্রয়ার ══ */}
      <div
        className={cn(
          "fixed inset-0 z-[550] bg-sky-950/40 backdrop-blur-[3px] transition-opacity duration-300 md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[560] flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border-t border-white/80 bg-white/95 px-4 pt-3 pb-6 shadow-[0_-14px_45px_rgba(2,132,199,0.18)] backdrop-blur-2xl transition-transform duration-[380ms] ease-[cubic-bezier(.32,.72,0,1)] md:hidden",
          mobileOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-muted/20" />
        <div className="mb-3 flex items-center justify-between border-b border-border-base/50 px-2 pb-2">
          <LogoMark isExpanded={true} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-800/70 hover:bg-border-base"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sleek-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-1 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-3">
              <div className="mb-1.5 px-3 font-body text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-[13px] font-bold transition-all duration-brand",
                        active ? "bg-sky-600 text-white shadow-xs" : "text-ink-800/80 hover:bg-surface-muted hover:text-sky-700"
                      )}
                    >
                      <NavIcon className={cn("h-5 w-5", active ? "text-white" : "text-ink-800/65")}>{item.icon}</NavIcon>
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border-base/60 pt-2">
          <form action={logout} onClick={() => setMobileOpen(false)}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 font-body text-[13px] font-bold text-danger transition-colors hover:bg-rose-100"
            >
              <NavIcon className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </NavIcon>
              লগআউট
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
