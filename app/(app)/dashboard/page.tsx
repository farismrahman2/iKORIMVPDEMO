"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import SkillRadar from "@/components/dashboard/SkillRadar";
import DailyMissions from "@/components/dashboard/DailyMissions";
import type { UserProfile, SkillTag, Mission, ReadinessBand } from "@/types";
import { Flame, FileText, Layers, BookOpen, Headphones } from "lucide-react";

const BAND_CONFIG: Record<
  ReadinessBand,
  { label: string; color: string; bg: string }
> = {
  strong: { label: "Strong Pass", color: "text-band-strong", bg: "bg-band-strong/20" },
  probable: { label: "Probable Pass", color: "text-band-probable", bg: "bg-band-probable/20" },
  borderline: { label: "Borderline", color: "text-band-borderline", bg: "bg-band-borderline/20" },
  high_risk: { label: "High Risk", color: "text-band-high_risk", bg: "bg-band-high_risk/20" },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<{ skill_tag: SkillTag; score: number }[]>([]);
  const [weakSkills, setWeakSkills] = useState<{ skill_tag: SkillTag; score: number }[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as UserProfile);
        if (!profileData.onboarded) {
          setShowOnboarding(true);
          setLoading(false);
          return;
        }
      }

      // Load skill scores
      const { data: skillData } = await supabase
        .from("user_skill_scores")
        .select("*")
        .eq("user_id", user.id);

      if (skillData) {
        const mapped = skillData.map((s: { skill_tag: string; score: number }) => ({
          skill_tag: s.skill_tag as SkillTag,
          score: s.score,
        }));
        setSkills(mapped);
        setWeakSkills(
          mapped
            .filter((s: { score: number }) => s.score < 60)
            .sort((a: { score: number }, b: { score: number }) => a.score - b.score)
            .slice(0, 3)
        );
      }

      // Load daily recommendations
      try {
        const res = await fetch("/api/recommendations/daily");
        const data = await res.json();
        if (data.missions) {
          setMissions(data.missions);
        }
      } catch {
        // Silently fail
      }

      setLoading(false);
    }

    load();
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

  const greeting = getGreeting();
  const band = profile?.readiness_band as ReadinessBand | undefined;
  const bandConfig = band ? BAND_CONFIG[band] : null;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting + Streak */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold">{profile?.name || "Learner"}</h1>
        </div>
        <div className="flex items-center gap-1 bg-navy-light rounded-lg px-3 py-2">
          <Flame size={18} className="text-accent-orange" />
          <span className="font-bold text-white">{profile?.streak || 0}</span>
        </div>
      </div>

      {/* Readiness Band */}
      {bandConfig && (
        <div className={`${bandConfig.bg} rounded-xl p-4 text-center`}>
          <p className={`text-3xl font-bold ${bandConfig.color}`}>
            {Math.round(profile?.pass_probability || 0)}%
          </p>
          <p className={`text-sm font-semibold ${bandConfig.color}`}>
            {bandConfig.label}
          </p>
        </div>
      )}

      {/* Daily Missions */}
      {missions.length > 0 && <DailyMissions missions={missions} />}

      {/* Weakest Skills */}
      {weakSkills.length > 0 && (
        <div className="bg-navy-light rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Weakest Skills
          </h3>
          <div className="space-y-2">
            {weakSkills.map((skill) => (
              <div
                key={skill.skill_tag}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-navy-lighter cursor-pointer"
                onClick={() => router.push("/vocab")}
              >
                <span className="text-sm text-gray-300 capitalize">
                  {skill.skill_tag.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-medium text-band-high_risk">
                  {Math.round(skill.score)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Take Mock", icon: FileText, href: "/exam", color: "bg-accent-orange/10 text-accent-orange" },
          { label: "Flashcards", icon: Layers, href: "/flashcards", color: "bg-accent-gold/10 text-accent-gold" },
          { label: "Vocab", icon: BookOpen, href: "/vocab", color: "bg-band-probable/10 text-band-probable" },
          { label: "Listening", icon: Headphones, href: "/listening", color: "bg-band-strong/10 text-band-strong" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex items-center gap-3 p-4 rounded-xl ${action.color} transition-colors hover:opacity-80`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Skill Radar */}
      {skills.length > 0 && <SkillRadar skills={skills} />}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
