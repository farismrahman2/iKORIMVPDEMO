"use client";

interface Testimonial {
  name: string;
  text: string;
  band: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const BAND_STYLES: Record<string, string> = {
  strong: "bg-ikori-50 text-ikori-700 border-ikori-200",
  probable: "bg-blue-50 text-blue-700 border-blue-200",
  borderline: "bg-amber-50 text-amber-700 border-amber-200",
  high_risk: "bg-red-50 text-red-700 border-red-200",
};

const BAND_LABELS: Record<string, string> = {
  strong: "Strong Pass",
  probable: "Probable Pass",
  borderline: "Borderline",
  high_risk: "High Risk",
};

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-20 px-4 sm:px-6 bg-ikori-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-dark mb-4">
            Learners love iKORI
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {testimonials.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] sm:w-auto snap-center card space-y-4">
              <p className="text-sm text-ikori-body leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-ikori-border">
                <span className="text-sm font-semibold text-ikori-dark">{t.name}</span>
                <span className={`text-xs px-2 py-1 rounded-ikori-full border ${BAND_STYLES[t.band] || BAND_STYLES.strong}`}>
                  {BAND_LABELS[t.band] || t.band}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
