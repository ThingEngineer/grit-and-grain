import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";

type ProfilePageProps = Readonly<{
  searchParams: Promise<{
    success?: string;
    error?: string;
    onboarding?: string;
  }>;
}>;

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, ranch_name")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const isOnboarding = params.onboarding === "true";

  return (
    <div className="mx-auto max-w-lg">
      {isOnboarding ? (
        <>
          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
            Welcome to Grit &amp; Grain
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Let&apos;s get your ranch set up. Tell us a bit about yourself so we
            can personalize your experience.
          </p>
        </>
      ) : (
        <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
          Profile
        </h1>
      )}

      {params.success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {params.success}
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      <form action={updateProfile} className="space-y-4">
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
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isOnboarding ? "Save & Continue" : "Save changes"}
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
      </form>
    </div>
  );
}
