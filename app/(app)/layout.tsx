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

  return (
    <div className="min-h-screen bg-navy pb-20">
      <main className="max-w-lg mx-auto">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navy-light border-t border-navy-lighter z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-accent-orange"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-accent-orange rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
