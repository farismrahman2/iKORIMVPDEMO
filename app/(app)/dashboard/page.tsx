"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import type { UserProfile } from "@/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data as UserProfile);
          if (!data.onboarded) {
            setShowOnboarding(true);
          }
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (showOnboarding && profile) {
    return (
      <OnboardingFlow
        userId={profile.id}
        onComplete={() => {
          setShowOnboarding(false);
          setProfile((p) => (p ? { ...p, onboarded: true } : p));
        }}
      />
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <p className="text-gray-400 text-sm">Welcome back</p>
        <h1 className="text-2xl font-bold">
          {profile?.name || "Learner"}
        </h1>
      </div>

      <div className="text-center text-gray-500 py-12">
        Dashboard content will be built in Phase 6
      </div>
    </div>
  );
}
