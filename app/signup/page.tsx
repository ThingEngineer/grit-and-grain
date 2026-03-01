"use client";

import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/errors";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const heroImages = [
  "/images/marketing/marketing-1.webp",
  "/images/marketing/marketing-2.webp",
  "/images/marketing/marketing-3.webp",
  "/images/marketing/marketing-4.webp",
];

export default function SignUpPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(Math.floor(Math.random() * heroImages.length));
  }, []);

  const handleSignUp = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(getErrorMessage(signUpError));
          return;
        }

        setMessage("Check your email for a confirmation link.");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Image panel — side on desktop, banner on mobile */}
      <div className="relative h-48 shrink-0 lg:h-auto lg:w-1/2">
        <Image
          src={heroImages[imageIndex]}
          alt="Ranch landscape"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-foreground/40" />

        {/* Desktop overlay text */}
        <div className="absolute inset-0 hidden flex-col justify-end p-12 lg:flex">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md font-serif text-2xl font-semibold leading-snug text-white"
          >
            Speak your day. Build your legacy.
          </motion.p>
        </div>

        {/* Mobile overlay — brand */}
        <div className="absolute inset-0 flex items-center justify-center p-6 lg:hidden">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold text-white"
          >
            Grit &amp; Grain
          </Link>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to home
          </Link>

          <h1 className="mb-2 font-serif text-2xl font-semibold text-foreground">
            Create an account
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Start building your ranch&apos;s permanent memory
          </p>

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {message}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSignUp(
                formData.get("email") as string,
                formData.get("password") as string,
              );
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-accent">
            Free for 30 days — all features included
          </p>
        </div>
      </div>
    </div>
  );
}
