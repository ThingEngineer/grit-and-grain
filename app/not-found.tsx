import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | Grit & Grain",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Image — always fully visible, scales with viewport */}
      <div className="w-full max-w-2xl">
        <Image
          src="/images/404.webp"
          alt="Lost on the range — 404 page not found"
          width={2816}
          height={1536}
          className="h-auto w-full rounded-2xl shadow-2xl"
          priority
        />
      </div>

      {/* Text content */}
      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-5xl font-semibold text-foreground sm:text-6xl">
          404
        </p>
        <h1 className="font-sans text-xl font-medium text-foreground sm:text-2xl">
          Looks like you&apos;ve ridden off the trail.
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Head back to familiar pastures.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
