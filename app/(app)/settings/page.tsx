"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import LanguageToggle from "@/components/LanguageToggle";
import { User, Globe, CreditCard, LogOut, Gift, HelpCircle } from "lucide-react";
import type { UserProfile } from "@/types";

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as UserProfile);
        setTier((data as Record<string, unknown>).tier as string || "free");
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-ikori-muted">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-ikori-dark">{t("language") === "ভাষা" ? "সেটিংস" : "Settings"}</h1>

      {/* Profile */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User size={18} className="text-ikori-500" />
          <h2 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">Profile</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ikori-muted">Name</span>
            <span className="text-ikori-dark font-medium">{profile?.name || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ikori-muted">Streak</span>
            <span className="text-ikori-dark font-medium">{profile?.streak || 0} days</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-ikori-500" />
            <span className="text-sm font-medium text-ikori-dark">{t("language")}</span>
          </div>
          <LanguageToggle />
        </div>
      </div>

      {/* Subscription */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={18} className="text-ikori-500" />
          <h2 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">Subscription</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ikori-body">Current plan</span>
          <span className={`badge ${tier === "paid" ? "bg-ikori-50 text-ikori-700 border-ikori-200" : ""}`}>
            {tier === "paid" ? "Full Access" : "Free"}
          </span>
        </div>
        {tier === "paid" ? (
          <button
            onClick={() => router.push("/settings/cancel")}
            className="text-sm text-red-500 hover:underline"
          >
            Cancel subscription
          </button>
        ) : (
          <button
            onClick={() => router.push("/n5/checkout")}
            className="btn-green w-full text-sm"
          >
            Upgrade to Full Access
          </button>
        )}
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        <button
          onClick={() => router.push("/referral")}
          className="card w-full flex items-center gap-3 text-left"
        >
          <Gift size={18} className="text-ikori-500" />
          <span className="text-sm font-medium text-ikori-dark">Refer a Friend</span>
        </button>
        <button
          onClick={() => router.push("/support")}
          className="card w-full flex items-center gap-3 text-left"
        >
          <HelpCircle size={18} className="text-ikori-500" />
          <span className="text-sm font-medium text-ikori-dark">Help & Support</span>
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="btn-secondary w-full flex items-center justify-center gap-2 text-red-500 border-red-200"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
