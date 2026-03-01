"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Wait for client to process tokens from URL fragment, then redirect
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 100);
    return () => clearTimeout(timer);
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
