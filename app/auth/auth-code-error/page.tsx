export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow dark:shadow-none text-center">
        <h1 className="mb-4 font-serif text-2xl font-semibold text-foreground">
          Authentication Error
        </h1>
        <p className="text-sm text-muted-foreground">
          There was a problem confirming your identity. The link may have
          expired.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
