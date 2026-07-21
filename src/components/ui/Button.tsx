import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" && "bg-navy text-white hover:bg-navy-light",
        variant === "secondary" &&
          "bg-accent-soft text-accent-dark hover:bg-accent-soft/80",
        variant === "ghost" && "bg-transparent text-navy hover:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
