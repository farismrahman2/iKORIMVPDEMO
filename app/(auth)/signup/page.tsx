"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, Language } from "@/lib/i18n";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang] = useState<Language>("en");
  const router = useRouter();
  const supabase = createClientComponentClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          name,
          phone: phone || null,
          onboarded: false,
          streak: 0,
          pass_probability: 0,
        });

      if (profileError) {
        setError("Account created but profile setup failed. Please try logging in.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ikori-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-ikori-dark">
            iKORI <span className="text-ikori-500">N5</span>
          </h1>
          <p className="text-ikori-muted mt-2 text-sm">{t('create_account', lang)}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ikori-body mb-1">
              {t('name', lang)}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ikori-body mb-1">
              {t('email', lang)}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ikori-body mb-1">
              {t('phone', lang)} <span className="text-ikori-muted">({t('optional', lang)})</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+880..."
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ikori-body mb-1">
              {t('password', lang)}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 rounded-ikori-sm p-3 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('creating_account', lang) : t('sign_up', lang)}
          </button>
        </form>

        <p className="text-center text-ikori-muted text-sm mt-6">
          {t('already_have', lang)}{" "}
          <Link href="/login" className="text-ikori-500 font-medium hover:underline">
            {t('sign_in', lang)}
          </Link>
        </p>
      </div>
    </div>
  );
}
