"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, t, TranslationKey } from "./i18n";
import { createClientComponentClient } from "./supabase";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadLang() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("language")
          .eq("id", user.id)
          .single();
        if (data?.language) setLangState(data.language as Language);
      }
    }
    loadLang();
  }, [supabase]);

  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ language: newLang })
        .eq("id", user.id);
    }
  };

  const translate = (
    key: TranslationKey,
    params?: Record<string, string | number>
  ) => {
    return t(key, lang, params);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
