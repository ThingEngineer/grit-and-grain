"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function handleRedirect() {
      // Give Supabase client time to process tokens from URL fragment
      await new Promise((resolve) => setTimeout(resolve, 100));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (!profile?.full_name) {
          router.push("/profile?onboarding=true");
          return;
        }
      }

      router.push("/dashboard");
    }

    handleRedirect();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
