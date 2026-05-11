/**
 * Filtros visuais unificados — chips coloridos com bordas, gradients e efeitos.
 *
 * Usar em qualquer lugar que precise de seletor de família/categoria/ordenação.
 *
 * Exemplo:
 *   <FilterChipGroup label="Filtrar por família" labelTone="primary" labelIcon={<Filter />}>
 *     <FilterChip tone="primary" active={f === "TODAS"} count={36} onClick={() => set("TODAS")}>
 *       Todas
 *     </FilterChip>
 *     <FilterChip tone="warning" active={f === "FOCO 2"} count={6} onClick={() => set("FOCO 2")}>
 *       FOCO 2
 *     </FilterChip>
 *   </FilterChipGroup>
 */

import type { ReactNode } from "react";

export type FilterTone =
  | "primary"
  | "warning"
  | "success"
  | "accent"
  | "destructive"
  | "foreground"
  | "neutral";

const TONE_STYLES: Record<FilterTone, { active: string; idle: string; count: string }> = {
  primary: {
    active:
      "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5),0_2px_4px_-1px_hsl(var(--primary)/0.3)] ring-2 ring-primary/30",
    idle: "bg-primary/8 text-primary border-primary/30 hover:bg-primary/15 hover:border-primary/50",
    count: "bg-primary/15 text-primary",
  },
  warning: {
    active:
      "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground border-warning shadow-[0_4px_12px_-2px_hsl(var(--warning)/0.5),0_2px_4px_-1px_hsl(var(--warning)/0.3)] ring-2 ring-warning/30",
    idle: "bg-warning/8 text-warning border-warning/30 hover:bg-warning/15 hover:border-warning/50",
    count: "bg-warning/15 text-warning",
  },
  success: {
    active:
      "bg-gradient-to-br from-success to-success/80 text-white border-success shadow-[0_4px_12px_-2px_hsl(var(--success)/0.5),0_2px_4px_-1px_hsl(var(--success)/0.3)] ring-2 ring-success/30",
    idle: "bg-success/8 text-success border-success/30 hover:bg-success/15 hover:border-success/50",
    count: "bg-success/15 text-success",
  },
  accent: {
    active:
      "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground border-accent shadow-[0_4px_12px_-2px_hsl(var(--accent)/0.5),0_2px_4px_-1px_hsl(var(--accent)/0.3)] ring-2 ring-accent/30",
    idle: "bg-accent/8 text-accent border-accent/30 hover:bg-accent/15 hover:border-accent/50",
    count: "bg-accent/15 text-accent",
  },
  destructive: {
    active:
      "bg-gradient-to-br from-destructive to-destructive/80 text-white border-destructive shadow-[0_4px_12px_-2px_hsl(var(--destructive)/0.5),0_2px_4px_-1px_hsl(var(--destructive)/0.3)] ring-2 ring-destructive/30",
    idle:
      "bg-destructive/8 text-destructive border-destructive/30 hover:bg-destructive/15 hover:border-destructive/50",
    count: "bg-destructive/15 text-destructive",
  },
  foreground: {
    active:
      "bg-gradient-to-br from-foreground to-foreground/80 text-background border-foreground shadow-[0_4px_12px_-2px_hsl(var(--foreground)/0.4),0_2px_4px_-1px_hsl(var(--foreground)/0.25)] ring-2 ring-foreground/30",
    idle: "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:border-foreground/30",
    count: "bg-foreground/10 text-foreground/80",
  },
  neutral: {
    active:
      "bg-gradient-to-br from-muted to-muted/80 text-foreground border-border shadow-md ring-2 ring-foreground/15",
    idle: "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground",
    count: "bg-muted text-muted-foreground",
  },
};

export interface FilterChipProps {
  active: boolean;
  tone?: FilterTone;
  count?: number | string;
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
  /** Tamanho — sm é mais compacto */
  size?: "sm" | "md";
  className?: string;
}

export function FilterChip({
  active,
  tone = "primary",
  count,
  icon,
  onClick,
  children,
  size = "md",
  className = "",
}: FilterChipProps) {
  const styles = TONE_STYLES[tone];
  const heightCls = size === "sm" ? "h-8 px-3 text-[11px]" : "h-9 px-3.5 text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center ${heightCls} rounded-full font-extrabold border-2 transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ring-offset-card ${
        active ? `${styles.active} scale-[1.04]` : `${styles.idle} hover:shadow-md hover:scale-[1.02]`
      } ${className}`}
    >
      {icon && <span className="mr-1.5 inline-flex items-center justify-center">{icon}</span>}
      {children}
      {count !== undefined && (
        <span
          className={`ml-1.5 tabular-nums px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
            active ? "bg-white/25" : styles.count
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export interface FilterChipGroupProps {
  /** Label opcional (em CAPS, com ícone). */
  label?: string;
  labelIcon?: ReactNode;
  /** Tom do label (cor do texto e do badge atrás do ícone). */
  labelTone?: "primary" | "accent" | "warning" | "success" | "muted";
  /** Quando `true`, força wrap em vez de scroll horizontal em mobile. */
  noScroll?: boolean;
  /** Adiciona separador vertical à esquerda (útil em desktop, quando agrupado em colunas). */
  withDivider?: boolean;
  children: ReactNode;
  className?: string;
}

const LABEL_TONE_STYLES: Record<
  NonNullable<FilterChipGroupProps["labelTone"]>,
  { text: string; bg: string }
> = {
  primary: { text: "text-primary", bg: "bg-primary/15" },
  accent: { text: "text-accent", bg: "bg-accent/15" },
  warning: { text: "text-warning", bg: "bg-warning/15" },
  success: { text: "text-success", bg: "bg-success/15" },
  muted: { text: "text-muted-foreground", bg: "bg-muted" },
};

export function FilterChipGroup({
  label,
  labelIcon,
  labelTone = "primary",
  noScroll = false,
  withDivider = false,
  children,
  className = "",
}: FilterChipGroupProps) {
  const ls = LABEL_TONE_STYLES[labelTone];
  return (
    <div className={`min-w-0 ${withDivider ? "lg:border-l-2 lg:border-border/60 lg:pl-4" : ""} ${className}`}>
      {label && (
        <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5 ${ls.text}`}>
          {labelIcon && (
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${ls.bg}`}>
              {labelIcon}
            </span>
          )}
          {label}
        </p>
      )}
      <div
        className={
          noScroll
            ? "flex gap-2 flex-wrap"
            : "flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 pb-1"
        }
      >
        {children}
      </div>
    </div>
  );
}

/** Helper: tom típico baseado no nome da família/categoria do MDTR. */
export function getMdtrFamiliaTone(familia: string): FilterTone {
  const f = familia.toUpperCase();
  if (f.includes("FOCO 1")) return "primary";
  if (f.includes("FOCO 2")) return "warning";
  if (f.includes("FOCO 3")) return "success";
  if (f.includes("LANCAMENTO")) return "accent";
  if (f.includes("DEMAIS")) return "foreground";
  return "primary";
}
