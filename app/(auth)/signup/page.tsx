"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-heading">
            iKORI <span className="text-accent-orange">N5</span>
          </h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange transition-colors"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm text-gray-300 mb-1">
              Phone <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange transition-colors"
              placeholder="+880..."
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange transition-colors"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-orange hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
