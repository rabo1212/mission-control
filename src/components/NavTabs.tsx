"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "대시보드" },
  { href: "/agents", label: "가재군단" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 bg-[#13131f] rounded-lg p-1 border border-[#1e1e30]">
      {tabs.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
  );
}
