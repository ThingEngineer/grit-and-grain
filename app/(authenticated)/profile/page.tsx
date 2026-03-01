import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

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
        <div
          role="alert"
          className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {params.success}
        </div>
      )}
      {params.error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {params.error}
        </div>
      )}

      <ProfileForm profile={profile} isOnboarding={isOnboarding} />
    </div>
  );
}
