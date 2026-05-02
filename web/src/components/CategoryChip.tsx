interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

export const CATEGORIES = [
  { value: "hortifruti", label: "Hortifruti", icon: "🥬" },
  { value: "queijos", label: "Queijos", icon: "🧀" },
  { value: "paes", label: "Pães", icon: "🥖" },
  { value: "doces", label: "Doces", icon: "🍯" },
  { value: "embutidos", label: "Embutidos", icon: "🥩" },
  { value: "conservas", label: "Conservas", icon: "🫙" },
  { value: "colonial", label: "Colonial", icon: "🫒" },
  { value: "bebidas", label: "Bebidas", icon: "🧉" },
  { value: "ovos", label: "Ovos e Aves", icon: "🥚" },
  { value: "artesanal", label: "Artesanal", icon: "🧶" },
  { value: "temperos", label: "Temperos", icon: "🌿" },
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
        `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
          active
            ? "border-primary bg-primary text-white shadow-sm scale-[1.02]"
            : "border-border bg-surface text-textSecondary hover:border-primary hover:text-primary hover:bg-primary-subtle"
        }`
      }
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </button>
  );
}
