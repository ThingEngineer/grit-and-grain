import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={[
      "w-full rounded-md border border-input bg-background px-3 py-2",
      "text-sm text-foreground shadow-sm placeholder:text-muted-foreground",
      "focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
Input.displayName = "Input";
