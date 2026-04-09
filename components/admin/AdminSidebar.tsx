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
    <aside className="w-60 bg-white border-r border-ikori-border flex flex-col min-h-screen">
      <div className="p-4 border-b border-ikori-border">
        <h1 className="text-lg font-display font-bold text-ikori-dark">
          iKORI <span className="text-ikori-500">Admin</span>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-ikori-sm text-sm font-medium transition-colors ${
                isActive
                  ? "bg-ikori-50 text-ikori-700 border-l-2 border-ikori-500"
                  : "text-ikori-muted hover:text-ikori-dark hover:bg-ikori-surface"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ikori-border space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-ikori-muted hover:text-ikori-dark transition-colors"
        >
          <ArrowLeft size={14} />
          Back to App
        </Link>
        <p className="text-xs text-ikori-muted truncate">{userEmail}</p>
      </div>
    </aside>
  );
}
