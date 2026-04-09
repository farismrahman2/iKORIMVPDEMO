"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Layers,
  Headphones,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/exam", label: "Exam", icon: FileText },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
  { href: "/flashcards", label: "Cards", icon: Layers },
  { href: "/listening", label: "Listen", icon: Headphones },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom nav during active exam sessions
  const isExamSession = /^\/exam\/[^/]+$/.test(pathname) && !pathname.includes("/results/");

  return (
    <div className="min-h-screen bg-ikori-white pb-20">
      <main className="max-w-lg mx-auto">{children}</main>

      {!isExamSession && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-ikori-border safe-bottom">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-3 text-xs transition-colors ${
                    isActive ? "text-ikori-500" : "text-ikori-muted"
                  }`}
                >
                  <Icon size={22} strokeWidth={1.5} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
