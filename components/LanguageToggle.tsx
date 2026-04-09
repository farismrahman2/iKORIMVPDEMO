"use client";

import { useLanguage } from "@/lib/language-context";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-ikori-full border border-ikori-border bg-white text-sm font-medium active:scale-[0.97] transition-all"
    >
      {lang === "en" ? "🇧🇩 বাংলা" : "🇬🇧 English"}
    </button>
  );
}
