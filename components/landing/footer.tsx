export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Grit &amp; Grain. All rights reserved.
      </div>
    </footer>
  );
}
