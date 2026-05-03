interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

// Categorias granulares (usadas no cadastro de produto e pela AI)
export const CATEGORIES = [
  { value: "frutas", label: "Frutas", icon: "🍎" },
  { value: "verduras", label: "Verduras", icon: "🥬" },
  { value: "legumes", label: "Legumes", icon: "🥕" },
  { value: "ovos", label: "Ovos", icon: "🥚" },
  { value: "carnes", label: "Carnes", icon: "🥩" },
  { value: "queijos", label: "Queijos", icon: "🧀" },
  { value: "frios", label: "Frios e Embutidos", icon: "🍖" },
  { value: "paes", label: "Pães", icon: "🥖" },
  { value: "doces", label: "Doces", icon: "🍰" },
  { value: "bebidas", label: "Bebidas", icon: "🧉" },
  { value: "temperos", label: "Temperos e Ervas", icon: "🌿" },
  { value: "conservas", label: "Conservas e Mel", icon: "🍯" },
  { value: "colonial", label: "Colonial", icon: "🏡" },
  { value: "artesanal", label: "Artesanal", icon: "🧶" },
  { value: "outros", label: "Outros", icon: "📦" },
];

// Grupos para filtro (agrupa múltiplas categorias granulares)
export const FILTER_GROUPS = [
  { value: "hortifruti", label: "Frutas e Verduras", icon: "🥬", includes: ["frutas", "verduras", "legumes", "hortifruti"] },
  { value: "proteinas", label: "Carnes e Ovos", icon: "🥩", includes: ["carnes", "ovos", "frios", "embutidos"] },
  { value: "laticinios", label: "Queijos e Laticínios", icon: "🧀", includes: ["queijos"] },
  { value: "padaria", label: "Pães e Doces", icon: "🥖", includes: ["paes", "doces"] },
  { value: "bebidas", label: "Bebidas", icon: "🧉", includes: ["bebidas"] },
  { value: "temperos", label: "Temperos e Ervas", icon: "🌿", includes: ["temperos"] },
  { value: "conservas", label: "Conservas e Mel", icon: "🍯", includes: ["conservas", "colonial", "artesanal"] },
  { value: "outros", label: "Outros", icon: "📦", includes: ["outros"] },
];

// Fallback para categorias legadas no banco de dados
const LEGACY_ICONS: Record<string, string> = {
  hortifruti: "🥬",
  embutidos: "🍖",
};

export function getCategoryIcon(category?: string | null): string {
  if (!category) return "🛒";
  return CATEGORIES.find((c) => c.value === category)?.icon ?? LEGACY_ICONS[category] ?? "🛒";
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
