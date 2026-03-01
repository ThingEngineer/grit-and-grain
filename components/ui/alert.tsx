type AlertVariant = "success" | "error" | "warning" | "info";

type AlertProps = Readonly<{
  variant: AlertVariant;
  children: React.ReactNode;
  role?: string;
  className?: string;
}>;

const variantClasses: Record<AlertVariant, string> = {
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  info: "border-border bg-muted text-foreground",
};

export function Alert({
  variant,
  children,
  role = "alert",
  className,
}: AlertProps) {
  return (
    <div
      role={role}
      className={`rounded-md border px-4 py-3 text-sm ${variantClasses[variant]} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
