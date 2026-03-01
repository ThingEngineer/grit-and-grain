import { getUser } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { updateEmail, updatePassword } from "./actions";
import { DeleteAccountSection } from "./delete-account-section";

type AccountPageProps = Readonly<{
  searchParams: Promise<{ success?: string; error?: string }>;
}>;

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getUser();

  if (!user) {
    return redirect("/login");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
        Account
      </h1>

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

      {/* Email Section */}
      <section className="mb-8">
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
          Email Address
        </h2>
        <form action={updateEmail} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={user.email ?? ""}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A confirmation email will be sent to both your old and new
              address.
            </p>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Update email
          </button>
        </form>
      </section>

      {/* Password Section */}
      <section className="mb-8">
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
          Change Password
        </h2>
        <form action={updatePassword} className="space-y-4">
          <div>
            <label
              htmlFor="current_password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="new_password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              required
              minLength={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              required
              minLength={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Update password
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="mb-4 font-serif text-lg font-semibold text-destructive">
          Danger Zone
        </h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-3 text-sm text-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <DeleteAccountSection />
        </div>
      </section>
    </div>
  );
}
