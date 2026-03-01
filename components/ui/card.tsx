type CardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={`border-b border-border px-4 py-3 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={`p-4 ${className ?? ""}`}>{children}</div>;
}
