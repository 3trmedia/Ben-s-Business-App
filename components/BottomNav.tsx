"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/clients", label: "Clients", icon: ClientsIcon },
  { href: "/past-clients", label: "Past", icon: PastIcon },
  { href: "/leads", label: "Leads", icon: LeadsIcon },
  { href: "/payments", label: "Payments", icon: PaymentsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide"
              >
                <Icon
                  className="h-6 w-6"
                  style={{
                    color: active ? "var(--accent)" : "var(--text-faint)",
                  }}
                />
                <span
                  style={{
                    color: active ? "var(--accent-strong)" : "var(--text-faint)",
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ClientsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" strokeLinecap="round" />
    </svg>
  );
}

function PastIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.6 2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeadsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M4 19V9l8-5 8 5v10" strokeLinejoin="round" />
      <path d="M4 19h16M9 19v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
      <path d="M3.5 9.5h17" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
