export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow dark:bg-zinc-900 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Authentication Error
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          There was a problem confirming your identity. The link may have
          expired.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
