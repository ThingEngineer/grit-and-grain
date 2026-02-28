import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow dark:bg-zinc-900">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome,{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {user.email}
          </span>
        </p>
        <form action="/api/auth/sign-out" method="POST">
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
