/**
 * Memento Médico — versão standalone (GitHub Pages).
 *
 * Layout limpo focado em prescrição: header médico-clínico, conteúdo principal
 * com o componente MementoPrescricaoPage e rodapé com disclaimer.
 */

import { lazy, Suspense } from "react";
import { Stethoscope, Pill } from "lucide-react";
import { motion } from "framer-motion";
import SectionSkeleton from "@/components/SectionSkeleton";
import { TOTAL_MEDICAMENTOS, CATEGORIAS_MEMENTO } from "@/data/mementoPrescricao";

const MementoPrescricaoPage = lazy(
  () => import("@/components/MementoPrescricaoPage"),
);

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* HEADER médico-clínico */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground flex items-center justify-center shadow-md">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-tight">
                  Mantecorp Farmasa
                </p>
                <h1 className="text-base sm:text-lg font-extrabold leading-tight text-foreground truncate">
                  Memento Médico — Pronto Atendimento
                </h1>
              </div>
            </div>

            {/* Stats compactos no header (desktop) */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="text-right leading-tight">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Patologias
                </p>
                <p className="text-sm font-extrabold tabular-nums text-foreground">
                  {CATEGORIAS_MEMENTO.length}
                </p>
              </div>
              <span className="h-8 w-px bg-border" />
              <div className="text-right leading-tight">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Medicamentos
                </p>
                <p className="text-sm font-extrabold tabular-nums text-foreground">
                  {TOTAL_MEDICAMENTOS}
                </p>
              </div>
            </div>

            {/* Badge mobile */}
            <div className="sm:hidden flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-1 text-[10px] font-extrabold tabular-nums shrink-0">
              <Pill className="h-3 w-3" />
              {TOTAL_MEDICAMENTOS}
            </div>
          </div>
        </div>
      </motion.header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-7">
        <Suspense fallback={<SectionSkeleton variant="cards" />}>
          <MementoPrescricaoPage />
        </Suspense>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/50 bg-card/40 mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 text-center space-y-1.5">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Material destinado exclusivamente a profissionais da saúde
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            <span className="font-semibold text-foreground">Mantecorp Farmasa</span> · Pronto
            Atendimento 2026 · Sempre revisar a posologia com a bula oficial e o quadro
            clínico do paciente antes de prescrever.
          </p>
        </div>
      </footer>
    </div>
  );
}
