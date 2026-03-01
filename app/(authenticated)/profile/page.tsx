import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/queries";
import { ProfileForm } from "@/components/profile-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";

type ProfilePageProps = Readonly<{
  searchParams: Promise<{
    success?: string;
    error?: string;
    onboarding?: string;
  }>;
}>;

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getUser();

  if (!user) {
    return redirect("/login");
  }

  const profile = await getProfile(user.id);

  const params = await searchParams;
  const isOnboarding = params.onboarding === "true";

  return (
    <div className="mx-auto max-w-lg">
      {isOnboarding ? (
        <>
          <PageHeader
            title="Welcome to Grit &amp; Grain"
            description="Let's get your ranch set up. Tell us a bit about yourself so we can personalize your experience."
          />
        </>
      ) : (
        <PageHeader title="Profile" />
      )}

      {params.success && (
        <Alert variant="success" className="mb-4">
          {params.success}
        </Alert>
      )}
      {params.error && (
        <Alert variant="error" className="mb-4">
          {params.error}
        </Alert>
      )}

      <ProfileForm profile={profile} isOnboarding={isOnboarding} />
    </div>
  );
}
