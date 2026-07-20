"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LiveIndicator from "./LiveIndicator";

const tabs = [
  { href: "/", label: "대시보드" },
  { href: "/workspace", label: "워크스페이스" },
  { href: "/pethouse", label: "펫 하우스" },
  { href: "/fleet", label: "봇 함대" },
  { href: "/reddit", label: "레딧 스나이퍼" },
  { href: "/tokens", label: "토큰/비용" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0">
    <nav className="flex gap-1 bg-[#13131f] rounded-lg p-1 border border-[#1e1e30] overflow-x-auto no-scrollbar flex-1 min-w-0">
      {tabs.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              active
                ? "bg-[#8b5cf6] text-white"
                : "text-[#a1a1aa] hover:text-white hover:bg-[#1e1e30]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
    <div className="shrink-0">
      <LiveIndicator />
    </div>
    </div>
  );
}
