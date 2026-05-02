import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const variantStyles: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-primary-medium active:scale-95",
    secondary: "bg-surface text-primary border border-primary hover:bg-primary-subtle active:scale-95",
    ghost: "bg-transparent text-primary hover:bg-primary-subtle active:scale-95",
  };

  const sizeStyles: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}
