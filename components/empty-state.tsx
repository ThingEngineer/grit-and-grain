import Link from "next/link";

type EmptyStateProps = Readonly<{
  message: string;
  actionLabel?: string;
  actionHref?: string;
}>;

export function EmptyState({
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
      <p
        className={`text-sm text-muted-foreground ${actionLabel ? "mb-4" : ""}`}
      >
        {message}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
