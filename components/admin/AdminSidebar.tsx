"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, Database, Headphones, BarChart3, ArrowLeft } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/content", label: "Content", icon: Database },
  { href: "/admin/audio", label: "Audio", icon: Headphones },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

interface AdminSidebarProps {
  userEmail: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-navy-light border-r border-navy-lighter flex flex-col min-h-screen">
      <div className="p-4 border-b border-navy-lighter">
        <h1 className="text-lg font-bold text-white">
          iKORI <span className="text-accent-orange">Admin</span>
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-orange/10 text-accent-orange border-l-2 border-accent-orange"
                  : "text-gray-400 hover:text-white hover:bg-navy-lighter"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-lighter space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to App
        </Link>
        <p className="text-xs text-gray-600 truncate">{userEmail}</p>
      </div>
    </aside>
  );
}
