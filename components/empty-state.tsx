import Link from "next/link";

type EmptyStateProps = Readonly<{
  message: string;
  actionLabel: string;
  actionHref: string;
}>;

export function EmptyState({
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      <Link
        href={actionHref}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
