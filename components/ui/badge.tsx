type BadgeVariant = "primary" | "accent" | "muted";

type BadgeProps = Readonly<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}>;

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ children, variant = "muted", className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
