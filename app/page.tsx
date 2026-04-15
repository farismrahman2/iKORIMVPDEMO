import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ModulePreview from "@/components/landing/ModulePreview";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FooterSection from "@/components/landing/FooterSection";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function LandingPage() {
  // Check if user is authenticated — redirect to dashboard
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  // Fetch landing page config (gracefully handle missing table/keys)
  const config: Record<string, string> = {};
  try {
    const adminDb = createServiceRoleClient();
    const { data: configRows } = await adminDb
      .from("landing_page_config")
      .select("key, value");

    if (configRows) {
      for (const row of configRows) {
        config[row.key] = row.value;
      }
    }
  } catch {
    // Table may not exist yet — render with defaults
  }

  // Build testimonials
  const testimonials = [1, 2, 3]
    .map((n) => ({
      name: config[`testimonial_${n}_name`] || "",
      text: config[`testimonial_${n}_text`] || "",
      band: config[`testimonial_${n}_band`] || "strong",
    }))
    .filter((t) => t.name && t.text);

  return (
    <div className="min-h-screen bg-ikori-white">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-ikori-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-display font-bold text-ikori-dark">
            iKORI <span className="text-ikori-500">N5</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-ikori-body">
            <a href="#pricing" className="hover:text-ikori-dark transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-ikori-dark transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ikori-muted hover:text-ikori-dark transition-colors font-medium">
              Sign In
            </Link>
            <Link href="/n5/trial" className="btn-primary text-xs px-4 py-2">
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection
        headline={config.hero_headline || "Pass JLPT N5 — or your money back."}
        subhead={config.hero_subhead || "Diagnostic-driven, Bangla-explained, built for Bangladeshi learners."}
        ctaText={config.cta_text || "Try 10 free questions →"}
        passStat={config.pass_rate_stat || "87% of learners improve within 30 days"}
      />

      <HowItWorks />
      <ModulePreview />

      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      <PricingSection
        monthlyPrice={config.pricing_monthly || "499"}
        examPrepPrice={config.pricing_exam_prep || "999"}
      />

      <FAQSection />

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-ikori-gradient">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-900 mb-6">
            Ready to start your N5 journey?
          </h2>
          <Link
            href="/n5/trial"
            className="inline-flex items-center gap-2 px-8 py-4 bg-ikori-dark text-white font-display font-bold text-lg rounded-ikori-full active:scale-[0.97] transition-all hover:bg-gray-800"
          >
            Try 10 free questions
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
