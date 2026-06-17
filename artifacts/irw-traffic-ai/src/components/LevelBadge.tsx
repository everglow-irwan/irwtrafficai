interface LevelBadgeProps {
  level: "lancar" | "sedang" | "padat" | "macet_total";
  size?: "sm" | "md";
}

const levelConfig = {
  lancar: { label: "Lancar", className: "level-lancar" },
  sedang: { label: "Sedang", className: "level-sedang" },
  padat: { label: "Padat", className: "level-padat" },
  macet_total: { label: "Macet Total", className: "level-macet_total" },
};

export default function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  const cfg = levelConfig[level] ?? levelConfig.sedang;
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center rounded font-semibold tracking-wide ${sizeClass} ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: "sedang" | "parah" | "sangat_parah";
}

const severityConfig = {
  sedang: { label: "Sedang", className: "severity-sedang" },
  parah: { label: "Parah", className: "severity-parah" },
  sangat_parah: { label: "Sangat Parah", className: "severity-sangat_parah" },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const cfg = severityConfig[severity] ?? severityConfig.sedang;
  return (
    <span className={`inline-flex items-center rounded text-[10px] px-1.5 py-0.5 font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
