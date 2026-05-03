interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

export const CATEGORIES = [
  { value: "hortifruti", label: "Frutas e Verduras", icon: "🥬" },
  { value: "padaria", label: "Pães e Doces", icon: "🥖" },
  { value: "frios", label: "Queijos e Frios", icon: "🧀" },
  { value: "carnes", label: "Carnes e Ovos", icon: "🥩" },
  { value: "bebidas", label: "Bebidas", icon: "🧉" },
  { value: "temperos", label: "Temperos e Ervas", icon: "🌿" },
  { value: "conservas", label: "Conservas e Mel", icon: "🍯" },
  { value: "outros", label: "Outros", icon: "📦" },
];

export function getCategoryIcon(category?: string | null): string {
  if (!category) return "🛒";
  return CATEGORIES.find((c) => c.value === category)?.icon ?? "🛒";
}

export function CategoryChip({ label, icon, active = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
          active
            ? "border-primary bg-primary text-white shadow-sm"
            : "border-border bg-surface text-textSecondary hover:border-primary hover:text-primary hover:bg-primary-subtle"
        }`
      }
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}
