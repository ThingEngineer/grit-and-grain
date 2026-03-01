"use client";

import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/errors";
import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const heroImage = "/images/marketing/marketing-5.webp";

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(getErrorMessage(signInError));
          return;
        }

        setMessage("Signed in successfully! Redirecting...");
        window.location.href = "/dashboard";
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return (
    <main className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Image panel — side on desktop, banner on mobile */}
      <div className="relative h-48 shrink-0 lg:h-auto lg:w-1/2">
        <Image
          src={heroImage}
          alt=""
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
            className="max-w-lg font-serif text-3xl font-semibold leading-snug text-zinc-900"
          >
            Your ranch has decades of hard-won knowledge. Grit &amp; Grain makes
            sure it&apos;s never lost.
          </motion.p>
        </div>

        {/* Mobile overlay — brand */}
        <div className="absolute inset-0 flex items-center justify-center p-6 lg:hidden">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold text-zinc-900"
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
            Sign in
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Welcome back to Grit &amp; Grain
          </p>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
            >
              {message}
            </p>
          )}

          <form
            aria-label="Sign in"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSignIn(
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
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                autoComplete="current-password"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-accent">
            Free for 30 days — all features included
          </p>
        </div>
      </div>
    </main>
  );
}
