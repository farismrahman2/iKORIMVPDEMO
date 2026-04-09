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
  strong: { label: "Strong Pass", color: "text-ikori-700", bg: "bg-ikori-50" },
  probable: { label: "Probable Pass", color: "text-blue-700", bg: "bg-blue-50" },
  borderline: { label: "Borderline", color: "text-amber-700", bg: "bg-amber-50" },
  high_risk: { label: "High Risk", color: "text-red-700", bg: "bg-red-50" },
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

      // Load profile (auto-create if missing)
      let { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        // Profile missing — create it now
        const { data: newProfile } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Learner",
            onboarded: false,
            streak: 0,
            pass_probability: 0,
          })
          .select()
          .single();
        profileData = newProfile;
      }

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
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted">Loading...</div>
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
  const score = Math.round(profile?.pass_probability || 0);

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Greeting + Streak */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ikori-muted text-sm">{greeting}</p>
          <h1 className="text-2xl font-display font-bold text-ikori-dark">
            {profile?.name || "Learner"}
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-ikori-50 border border-ikori-200 rounded-ikori-full px-3 py-2">
          <Flame size={18} strokeWidth={1.5} className="text-ikori-500" />
          <span className="font-bold text-ikori-dark">{profile?.streak || 0}</span>
        </div>
      </div>

      {/* Readiness Band */}
      {bandConfig && (
        <div className="bg-ikori-gradient rounded-ikori p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ikori-800 text-sm font-medium">Your readiness</p>
              <p className="text-ikori-900 text-3xl font-display font-bold">{score}%</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-ikori-full px-4 py-2">
              <p className="text-ikori-800 text-sm font-semibold">{bandConfig.label}</p>
            </div>
          </div>
          <div className="h-2 bg-white/30 rounded-full">
            <div
              className="h-2 bg-ikori-700 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Daily Missions */}
      {missions.length > 0 && <DailyMissions missions={missions} />}

      {/* Weakest Skills */}
      {weakSkills.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
            Weakest Skills
          </h3>
          <div className="space-y-2">
            {weakSkills.map((skill) => (
              <div
                key={skill.skill_tag}
                className="flex items-center justify-between p-2 rounded-ikori-sm hover:bg-ikori-surface cursor-pointer transition-colors"
                onClick={() => router.push("/vocab")}
              >
                <span className="text-sm text-ikori-body capitalize">
                  {skill.skill_tag.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-medium text-red-500">
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
          { label: "Take Mock", icon: FileText, href: "/exam", color: "bg-ikori-50 text-ikori-700" },
          { label: "Flashcards", icon: Layers, href: "/flashcards", color: "bg-ikori-50 text-ikori-700" },
          { label: "Vocab", icon: BookOpen, href: "/vocab", color: "bg-blue-50 text-blue-700" },
          { label: "Listening", icon: Headphones, href: "/listening", color: "bg-ikori-cyan-50 text-ikori-cyan-500" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex items-center gap-3 p-4 rounded-ikori border border-ikori-border shadow-ikori-sm ${action.color} transition-colors hover:opacity-80`}
            >
              <Icon size={18} strokeWidth={1.5} />
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
