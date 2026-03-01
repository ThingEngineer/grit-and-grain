"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileMenu } from "@/components/profile-menu";

type NavProps = Readonly<{
  userName: string;
}>;

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/diary", label: "Diary" },
  { href: "/pastures", label: "Pastures" },
  { href: "/herds", label: "Herds" },
  { href: "/chat", label: "Farm Memory" },
  { href: "/review", label: "Weekly Review" },
];

export function Nav({ userName }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background">
      {/* Main bar */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-serif text-lg font-bold tracking-tight text-foreground"
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop: toggle + profile menu */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <ProfileMenu userName={userName} />
        </div>

        {/* Mobile: theme toggle + hamburger button */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-5xl px-4 pb-4">
            <div className="flex flex-col">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex flex-col border-t border-border pt-3">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Profile
              </Link>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Account
              </Link>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  {userName}
                </span>
                <form action="/api/auth/sign-out" method="POST">
                  <button
                    type="submit"
                    className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
