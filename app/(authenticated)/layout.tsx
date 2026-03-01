import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { OfflineProvider } from "@/components/offline-provider";
import { OfflineBanner } from "@/components/offline-banner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { getUser, getProfile } from "@/lib/supabase/queries";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  if (!user) {
    return redirect("/login");
  }

  const profile = await getProfile(user.id);
  const userName = profile?.full_name || user.email || "Unknown";

  return (
    <OfflineProvider>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
        >
          Skip to main content
        </a>
        <Nav userName={userName} />
        <OfflineBanner />
        <PwaInstallPrompt />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-5xl px-4 py-8 outline-none"
        >
          {children}
        </main>
      </div>
    </OfflineProvider>
  );
}
