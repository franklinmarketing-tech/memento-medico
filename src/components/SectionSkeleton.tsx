import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton padronizado para seções lazy-loaded.
 * Usa a mesma estrutura visual das telas reais (header + cards/lista)
 * para reduzir percepção de espera vs spinner genérico.
 */
export default function SectionSkeleton({ variant = "list" }: { variant?: "list" | "cards" | "dashboard" }) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[190px] rounded-2xl" />
        ))}
      </div>
    );
  }

  // list
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
