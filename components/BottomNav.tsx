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
      <rect x="3.5" y="8" width="17" height="11" rx="2.2" />
      <path d="M9 8V6.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 13h17" strokeLinecap="round" />
    </svg>
  );
}

function PastIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.3" />
      <path d="M4.5 9v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9" strokeLinejoin="round" />
      <path d="M10 13h4" strokeLinecap="round" />
    </svg>
  );
}

function LeadsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5Z" strokeLinecap="round" strokeLinejoin="round" />
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
