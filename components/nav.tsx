"use client";

import Link from "next/link";
import { useState } from "react";

type NavProps = Readonly<{
  userEmail: string;
}>;

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/diary", label: "Diary" },
  { href: "/pastures", label: "Pastures" },
  { href: "/herds", label: "Herds" },
  { href: "/chat", label: "Farm Memory" },
  { href: "/review", label: "Weekly Review" },
];

export function Nav({ userEmail }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Main bar */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            onClick={() => setMenuOpen(false)}
          >
            Grit &amp; Grain
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop: email + sign out */}
        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {userEmail}
          </span>
          <form action="/api/auth/sign-out" method="POST">
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Mobile: hamburger button */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
        >
          {menuOpen ? (
            /* X icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <div className="mx-auto max-w-5xl px-4 pb-4">
            <div className="flex flex-col">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {userEmail}
              </span>
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
