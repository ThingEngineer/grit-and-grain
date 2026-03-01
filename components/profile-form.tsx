"use client";

import { useTransition, useRef } from "react";
import { updateProfile } from "@/app/(authenticated)/profile/actions";
import { useOffline } from "@/components/offline-provider";

type ProfileFormProps = Readonly<{
  profile: { full_name: string | null; ranch_name: string | null } | null;
  isOnboarding: boolean;
}>;

export function ProfileForm({ profile, isOnboarding }: ProfileFormProps) {
  const { isOnline, enqueue } = useOffline();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("full_name") as string;
    const ranchName = formData.get("ranch_name") as string;

    if (isOnline) {
      startTransition(async () => {
        await updateProfile(formData);
      });
    } else {
      await enqueue({
        type: "update_profile",
        data: {
          full_name: fullName || undefined,
          ranch_name: ranchName || undefined,
        },
      });
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {isOnboarding && <input type="hidden" name="onboarding" value="true" />}

      <div>
        <label
          htmlFor="full_name"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Your name"
        />
      </div>

      <div>
        <label
          htmlFor="ranch_name"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Ranch Name
        </label>
        <input
          type="text"
          id="ranch_name"
          name="ranch_name"
          defaultValue={profile?.ranch_name ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Your ranch name"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used in your dashboard heading and weekly reviews.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending
            ? "Saving…"
            : isOnboarding
              ? "Save & Continue"
              : "Save changes"}
        </button>
        {isOnboarding && (
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </a>
        )}
      </div>

      {!isOnline && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Saved locally — will sync when you reconnect
        </p>
      )}
    </form>
  );
}
