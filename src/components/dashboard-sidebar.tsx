"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Star } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-r border-zinc-200 bg-white p-5 md:min-h-screen md:w-64">
      <div className="mb-8 text-xl font-semibold">Dashboard</div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary)] !text-white"
                  : "!text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
