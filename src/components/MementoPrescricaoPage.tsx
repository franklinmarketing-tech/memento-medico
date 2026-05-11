import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Copy,
  Check,
  ClipboardCopy,
  Stethoscope,
  Info,
  Pill,
  ChevronRight,
  X,
  ListFilter,
  Library,
  Clock,
  Plus,
  FileText,
  Trash2,
  Sparkles,
  CheckCircle2,
  ClipboardList,
  Eraser,
} from "lucide-react";
import {
  MEDICAMENTOS_MEMENTO,
  CATEGORIAS_MEMENTO,
  contarPorCategoria,
  TOTAL_MEDICAMENTOS,
  aplicarIntervalo,
  type MedicamentoMemento,
  type CategoriaMemento,
} from "@/data/mementoPrescricao";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";

// =====================================================================================
// TIPOS
// =====================================================================================

type CopyState = { id: string; field: "nome" | "receita" } | null;
type Selecao = CategoriaMemento | "todos" | null;
type SelecaoPorMed = Record<string, { posologiaIdx: number; intervaloIdx: number }>;

interface ItemReceita {
  medId: string;
  posologiaIdx: number;
  intervaloIdx: number;
}

// =====================================================================================
// HELPERS
// =====================================================================================

/**
 * Resolve a URL de uma imagem do produto considerando o `base` do Vite.
 * - Em dev (`base: "/"`) -> "/produtos/foo.png"
 * - Em GitHub Pages (`base: "/memento-medico/"`) -> "/memento-medico/produtos/foo.png"
 * - URLs absolutas (http://...) passam direto, sem prefixo.
 */
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.BASE_URL || "/";
  // Garante exatamente uma barra entre base e path
  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const pathClean = url.startsWith("/") ? url : `/${url}`;
  return `${baseClean}${pathClean}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Aplica siglas-padrão de prescrição médica (VO, cp, gts, 1x/dia, 8/8h, etc.). */
function abreviar(texto: string): string {
  return texto
    // Vias de administração
    .replace(/\bpor via sublingual\b/gi, "SL")
    .replace(/\bvia sublingual\b/gi, "SL")
    .replace(/\bpor via intramuscular\b/gi, "IM")
    .replace(/\bpor via subcutânea\b/gi, "SC")
    .replace(/\bpor via intravenosa\b/gi, "IV")
    // Frequência
    .replace(/(\d+)\s+vezes?\s+ao\s+dia/gi, "$1x/dia")
    .replace(/(\d+)\s+vezes?\s+por\s+dia/gi, "$1x/dia")
    .replace(/uma\s+vez\s+ao\s+dia/gi, "1x/dia")
    .replace(/duas\s+vezes\s+ao\s+dia/gi, "2x/dia")
    .replace(/de\s+(\d+)\s+em\s+(\d+)\s+horas?/gi, "$1/$2h")
    // Duração
    .replace(/durante\s+(\d+)\s+a\s+(\d+)\s+dias?/gi, "por $1-$2 dias")
    .replace(/durante\s+(\d+)\s+dias?/gi, "por $1 dias")
    .replace(/durante\s+(\d+)\s+semanas?/gi, "por $1 semanas")
    // Formas farmacêuticas — siglas padrão
    .replace(/\bcomprimidos\b/gi, "cps")
    .replace(/\bcomprimido\b/gi, "cp")
    .replace(/\bcápsulas\b/gi, "cáps")
    .replace(/\bcápsula\b/gi, "cáp")
    .replace(/\bflaconetes\b/gi, "flac")
    .replace(/\bflaconete\b/gi, "flac")
    .replace(/\bunidades\b/gi, "un")
    .replace(/\bunidade\b/gi, "un")
    // Atalhos clínicos
    .replace(/\bconforme necessidade\b/gi, "SN")
    .replace(/\bse necessário\b/gi, "SN")
    .replace(/(\d+)\s*minutos?/gi, "$1 min")
    .replace(/\bem jejum\b/gi, "em jejum")
    .replace(/\bkg de peso\b/gi, "kg")
    .replace(/\bcerca de\s+(\d+)/gi, "$1")
    // Limites de dose — "Não exceder / Dose máxima / Usar no máximo" → máx
    .replace(/Não exceder\s+(\d+(?:\s*a\s*\d+)?)\s+(\S+)\s+por\s+(dose|dia)/gi, "máx $1 $2/$3")
    .replace(/Não exceder\s+(\d+(?:\s*a\s*\d+)?)\s+(\S+)\s+em\s+24\s+horas?/gi, "máx $1 $2/dia")
    .replace(/Dose máxima\s+(\d+(?:\s*a\s*\d+)?)\s+(\S+)\/dia/gi, "máx $1 $2/dia")
    .replace(/Dose máxima\s+(\d+(?:\s*a\s*\d+)?)\s+(\S+)\s+por\s+dia/gi, "máx $1 $2/dia")
    .replace(/Usar no máximo\s+(\d+)\s+dias?/gi, "máx $1 dias")
    // Limpezas (redundâncias verbosas)
    .replace(/\bvárias vezes ao dia\s*\(([^)]+)\)/gi, "$1")
    .replace(/\bRealizar lavagem nasal\b/gi, "Lavagem nasal")
    .replace(/\bIntroduzir o bico aplicador (anatômico )?em cada narina e nebulizar pelo tempo necessário(\s+para\s+boa\s+higieniza[çc][ãa]o)?/gi, "Nebulizar em cada narina");
}

function obterTextoReceita(item: ItemReceita): { titulo: string; texto: string } | null {
  const med = MEDICAMENTOS_MEMENTO.find((m) => m.id === item.medId);
  if (!med) return null;
  const p = med.posologias[item.posologiaIdx] ?? med.posologias[0];
  const iv =
    p.intervalos && p.intervalos.length > 0
      ? p.intervalos[Math.min(item.intervaloIdx, p.intervalos.length - 1)]
      : null;
  let texto = aplicarIntervalo(p.textoReceita, iv, "texto");

  // 1. Remove sufixo "Para crianças/Para N anos." no final (frases curtas de idade)
  texto = texto
    .replace(/\s*Para (crianças )?(de |acima de )?\d+[^.:]*anos?\.?\s*$/gi, "")
    .trim();

  // 2. Remove prefixo "Para crianças de X kg (Y anos): " — mantém apenas a dose após o ":"
  //    Ex: "Lisador gotas — Para crianças de 5 a 15 kg (3 meses a 3 anos): administrar 2 a 8 gotas..."
  //         vira "Lisador gotas — Administrar 2 a 8 gotas..."
  texto = texto.replace(
    /^(.+? — )Para (crianças )?(de |acima de )?[^:]+:\s*([a-záéíóúâêôãõç])/i,
    (_m, prefix: string, _c1, _c2, firstLetter: string) =>
      `${prefix}${firstLetter.toUpperCase()}`,
  );

  // 3. Injeta a apresentação do produto (sem nº MS) logo após o nome do medicamento
  if (med.apresentacao) {
    const apresLimpa = med.apresentacao.replace(/\s*\(MS [^)]+\)\s*/g, "").trim();
    if (apresLimpa) {
      const sep = " — ";
      const idx = texto.indexOf(sep);
      if (idx > 0) {
        texto = `${texto.slice(0, idx)} (${apresLimpa})${texto.slice(idx)}`;
      } else {
        texto = `${texto} — ${apresLimpa}`;
      }
    }
  }

  // 4. Abrevia para o padrão de prescrição médica (VO, cps, 1x/dia, máx, etc.)
  texto = abreviar(texto);

  // 5. Remove frases de limite de dose / "máx N…" — orientações ficam apenas no card
  //    Ex: "...em caso de dor. máx 4 cps/dia. máx 5 dias." → "...em caso de dor."
  texto = texto
    .split(/\.\s+/)
    .filter((p) => !/^(máx|Máx)\s/.test(p.trim()))
    .join(". ")
    .replace(/\.\s*$/, "")
    .trim();
  if (texto && !texto.endsWith(".")) texto += ".";

  return {
    titulo: med.nome,
    texto,
  };
}

function formatarReceitaCompleta(itens: ItemReceita[]): string {
  if (itens.length === 0) return "";
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const linhas: string[] = [];
  linhas.push("PRESCRIÇÃO MÉDICA");
  linhas.push(`Data: ${dataAtual}`);
  linhas.push("");
  itens.forEach((item, i) => {
    const r = obterTextoReceita(item);
    if (!r) return;
    linhas.push(`${i + 1}. ${r.texto}`);
    linhas.push("");
  });
  return linhas.join("\n").replace(/\n+$/, "");
}

// =====================================================================================
// SUBCOMPONENTES
// =====================================================================================

function HeaderSecao({
  icone,
  titulo,
  abordagem,
  count,
  isTodos,
}: {
  icone: string;
  titulo: string;
  abordagem?: string;
  count: number;
  isTodos: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-card ${
        isTodos
          ? "border-accent/30 bg-gradient-to-br from-accent/15 via-card to-warning/5"
          : "border-primary/25 bg-gradient-to-br from-primary/10 via-card to-accent/5"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-2xl border flex items-center justify-center text-3xl sm:text-4xl shadow-sm ${
            isTodos ? "bg-card border-accent/40" : "bg-card border-primary/30"
          }`}
        >
          {icone}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${
              isTodos ? "text-accent" : "text-primary"
            }`}
          >
            {isTodos ? "Pesquisa geral" : "Patologia selecionada"}
          </p>
          <h2 className="text-base sm:text-2xl font-extrabold leading-tight text-foreground truncate">
            {titulo}
          </h2>
          {abordagem && (
            <p className="text-[11px] sm:text-xs text-muted-foreground italic mt-1 leading-snug line-clamp-2">
              {abordagem}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums ${
            isTodos ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          <Pill className="h-3 w-3" />
          {count}
        </span>
      </div>
    </div>
  );
}

function MedicamentoCard({
  med,
  index,
  copied,
  posologiaSelecionadaIdx,
  intervaloSelecionadoIdx,
  jaNaReceita,
  onSelecionarPosologia,
  onSelecionarIntervalo,
  onCopy,
  onAdicionarReceita,
}: {
  med: MedicamentoMemento;
  index: number;
  copied: CopyState;
  posologiaSelecionadaIdx: number;
  intervaloSelecionadoIdx: number;
  jaNaReceita: boolean;
  onSelecionarPosologia: (id: string, idx: number) => void;
  onSelecionarIntervalo: (id: string, idx: number) => void;
  onCopy: (med: MedicamentoMemento, field: "nome" | "receita") => void;
  onAdicionarReceita: (med: MedicamentoMemento) => void;
}) {
  const copiedNome = copied?.id === med.id && copied.field === "nome";
  const copiedReceita = copied?.id === med.id && copied.field === "receita";
  const posologiaAtiva = med.posologias[posologiaSelecionadaIdx] ?? med.posologias[0];
  const temMultiplas = med.posologias.length > 1;
  const temIntervalos = !!posologiaAtiva.intervalos && posologiaAtiva.intervalos.length > 0;
  const intervaloAtivo = temIntervalos
    ? posologiaAtiva.intervalos![Math.min(intervaloSelecionadoIdx, posologiaAtiva.intervalos!.length - 1)]
    : null;
  const [zoomOpen, setZoomOpen] = useState(false);

  // ESC fecha o zoom
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

  const resumoFinal = aplicarIntervalo(posologiaAtiva.resumo, intervaloAtivo, "resumo");
  const textoReceitaFinal = aplicarIntervalo(posologiaAtiva.textoReceita, intervaloAtivo, "texto");

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.18) }}
      className="group rounded-2xl border border-border/70 bg-card p-3 sm:p-4 xl:p-3.5 ring-1 ring-primary/5 ring-offset-0 shadow-[0_1px_0_0_hsl(var(--background)/0.6)_inset,0_1px_2px_-1px_hsl(var(--foreground)/0.06),0_8px_16px_-6px_hsl(var(--foreground)/0.08),0_18px_36px_-12px_hsl(var(--primary)/0.14),0_2px_4px_0_hsl(var(--primary)/0.03)] hover:ring-primary/12 hover:border-primary/30 hover:shadow-[0_1px_0_0_hsl(var(--background)/0.7)_inset,0_2px_4px_-1px_hsl(var(--foreground)/0.08),0_14px_28px_-8px_hsl(var(--foreground)/0.10),0_28px_56px_-16px_hsl(var(--primary)/0.24),0_4px_8px_0_hsl(var(--primary)/0.08)] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent"
    >
      {/* Indicador "já na receita" */}
      {jaNaReceita && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success border border-success/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3" /> Na receita
          </span>
        </div>
      )}

      {/* Topo: imagem + nome + princípio ativo */}
      <div className="flex items-start gap-2.5 sm:gap-3 pr-11 sm:pr-14">
        {/* Thumb do produto — clicável pra abrir zoom em fullscreen */}
        <button
          type="button"
          onClick={() => med.imagem && setZoomOpen(true)}
          disabled={!med.imagem}
          aria-label={med.imagem ? `Ampliar imagem de ${med.nome}` : undefined}
          className="group/img relative shrink-0 h-20 w-20 sm:h-28 sm:w-28 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center overflow-hidden shadow-sm transition-all hover:border-primary/40 hover:shadow-md disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {med.imagem ? (
            <img
              src={resolveImageUrl(med.imagem)}
              alt={med.nome}
              loading="lazy"
              className="h-full w-full object-contain p-1.5 group-hover/img:scale-105 transition-transform duration-200"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fallback = (e.currentTarget.nextElementSibling as HTMLElement | null);
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className="h-full w-full items-center justify-center text-4xl sm:text-5xl"
            style={{ display: med.imagem ? "none" : "flex" }}
            aria-hidden
          >
            💊
          </span>
          {/* Indicador de zoom — sempre visível pra deixar claro que é clicável */}
          {med.imagem && (
            <span className="pointer-events-none absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-foreground/85 text-background px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider shadow-md group-hover/img:bg-primary group-hover/img:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              Zoom
            </span>
          )}
        </button>

        {/* Overlay de zoom — fullscreen com a imagem grande */}
        <AnimatePresence>
          {zoomOpen && med.imagem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setZoomOpen(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/85 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
              role="dialog"
              aria-modal="true"
              aria-label={`Visualização ampliada de ${med.nome}`}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomOpen(false); }}
                className="absolute top-4 right-4 h-10 w-10 inline-flex items-center justify-center rounded-full bg-background/95 hover:bg-background text-foreground shadow-lg border border-border transition-all hover:scale-105 z-10"
                aria-label="Fechar zoom"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <motion.div
                initial={{ scale: 0.92, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 4 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-[92vw] max-h-[88vh] rounded-2xl bg-card p-3 sm:p-5 shadow-2xl border border-border flex flex-col items-center gap-3"
              >
                <img
                  src={resolveImageUrl(med.imagem)}
                  alt={med.nome}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
                <div className="text-center px-2">
                  <p className="text-base sm:text-lg font-extrabold text-foreground leading-tight">{med.nome}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{med.apresentacao}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm sm:text-base font-extrabold text-foreground leading-tight break-words">
              {med.nome}
            </h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Mantecorp
            </span>
          </div>
          <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold mt-0.5 leading-snug">
            {med.principioAtivo}
          </p>
        </div>
      </div>

      {/* Botão pequeno "Copiar Nome" — só ícone em colunas estreitas */}
      <button
        type="button"
        onClick={() => onCopy(med, "nome")}
        title="Copiar apenas o nome do medicamento"
        aria-label="Copiar nome"
        className={`absolute top-3 right-3 h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
          jaNaReceita ? "translate-y-7" : ""
        } ${
          copiedNome
            ? "bg-success text-success-foreground border-success"
            : "bg-muted/40 hover:bg-muted text-foreground/70 border-border"
        }`}
      >
        {copiedNome ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nome</span>
          </>
        )}
      </button>

      {/* Apresentação + idade — sempre 1 coluna em card estreito */}
      <div className="mt-2.5 space-y-1 text-[11px] sm:text-[12px] text-foreground/85">
        <p className="break-words">
          <span className="font-bold text-foreground/70 mr-1">Apresentação:</span>
          {med.apresentacao}
        </p>
        {med.idade && (
          <p className="break-words">
            <span className="font-bold text-foreground/70 mr-1">Idade:</span>
            {med.idade}
          </p>
        )}
      </div>

      {/* Indicação */}
      <div className="mt-2 flex items-start gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 mt-0.5 shrink-0">
          Indicação:
        </span>
        <span className="text-[12px] text-foreground/90 leading-snug font-medium">
          {med.indicacao}
        </span>
      </div>

      {/* Seletor de posologia */}
      {temMultiplas && (
        <FilterChipGroup
          label={`Escolha a posologia · ${med.posologias.length} opções`}
          labelTone="primary"
          labelIcon={<ListFilter className="h-3 w-3 text-primary" />}
          noScroll
          className="mt-3"
        >
          {med.posologias.map((p, idx) => (
            <FilterChip
              key={`${med.id}-pos-${idx}`}
              tone="primary"
              size="sm"
              active={idx === posologiaSelecionadaIdx}
              onClick={() => onSelecionarPosologia(med.id, idx)}
            >
              {p.rotulo}
            </FilterChip>
          ))}
        </FilterChipGroup>
      )}

      {/* Seletor de intervalo de horário */}
      {temIntervalos && (
        <FilterChipGroup
          label="Intervalo de horário"
          labelTone="accent"
          labelIcon={<Clock className="h-3 w-3 text-accent" />}
          noScroll
          className="mt-2.5"
        >
          {posologiaAtiva.intervalos!.map((iv, idx) => (
            <FilterChip
              key={`${med.id}-iv-${idx}`}
              tone="accent"
              size="sm"
              active={iv.rotulo === intervaloAtivo?.rotulo}
              onClick={() => onSelecionarIntervalo(med.id, idx)}
            >
              {iv.rotulo}
            </FilterChip>
          ))}
        </FilterChipGroup>
      )}

      {/* Caixa de posologia para receita */}
      <motion.div
        key={`${med.id}-${posologiaSelecionadaIdx}-${intervaloAtivo?.rotulo ?? "x"}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-2.5 sm:p-3"
      >
        <div className="flex flex-col gap-0.5 mb-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
            {temMultiplas ? `Posologia: ${posologiaAtiva.rotulo}` : "Posologia para receita"}
            {intervaloAtivo && (
              <span className="ml-1.5 text-accent">· {intervaloAtivo.rotulo}</span>
            )}
          </p>
          <span className="text-[10px] font-bold text-primary/70 leading-tight">
            {resumoFinal}
          </span>
        </div>
        <p className="text-[12px] text-foreground leading-relaxed font-medium select-text">
          {textoReceitaFinal}
        </p>
        {posologiaAtiva.observacao && (
          <p className="text-[10.5px] text-muted-foreground italic mt-1.5 leading-snug">
            {posologiaAtiva.observacao}
          </p>
        )}
      </motion.div>

      {/* Tags */}
      {med.tags && med.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {med.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Botões de ação — em colunas estreitas (3 col desktop) ficam empilhados */}
      <div className="mt-auto pt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => onCopy(med, "receita")}
          className={`h-10 rounded-xl text-xs sm:text-sm font-extrabold border flex items-center justify-center gap-1.5 transition-all shadow-card ${
            copiedReceita
              ? "bg-success text-success-foreground border-success"
              : "bg-primary text-primary-foreground border-primary hover:bg-primary/90 active:scale-[0.98]"
          }`}
        >
          {copiedReceita ? (
            <>
              <Check className="h-4 w-4" /> Copiado!
            </>
          ) : (
            <>
              <ClipboardCopy className="h-4 w-4" />
              <span>Copiar receita</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onAdicionarReceita(med)}
          className={`h-10 px-3 sm:px-4 rounded-xl text-xs font-extrabold border-2 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98] ${
            jaNaReceita
              ? "bg-gradient-to-br from-success to-success/85 text-success-foreground border-success/60 hover:from-success/95 hover:to-success/75"
              : "bg-gradient-to-br from-accent to-accent/85 text-accent-foreground border-accent/60 hover:from-accent/95 hover:to-accent/75"
          }`}
          title={jaNaReceita ? "Atualizar item na receita acumulativa" : "Adicionar à receita acumulativa"}
          aria-label={jaNaReceita ? "Atualizar na receita" : "Adicionar à receita"}
        >
          {jaNaReceita ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Atualizar receita</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0" strokeWidth={3} />
              <span>Adicionar à receita</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

/** Drawer flutuante com a receita acumulativa. */
function ReceitaDrawer({
  open,
  onClose,
  itens,
  onRemover,
  onLimpar,
}: {
  open: boolean;
  onClose: () => void;
  itens: ItemReceita[];
  onRemover: (medId: string) => void;
  onLimpar: () => void;
}) {
  const [copiouTudo, setCopiouTudo] = useState(false);
  const textoCompleto = useMemo(() => formatarReceitaCompleta(itens), [itens]);

  // ESC fecha o drawer (acessibilidade)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleCopiarTudo = async () => {
    if (itens.length === 0) {
      toast.error("Adicione medicamentos à receita antes de copiar.");
      return;
    }
    const ok = await copyToClipboard(textoCompleto);
    if (ok) {
      setCopiouTudo(true);
      toast.success(`Receita com ${itens.length} medicamento(s) copiada!`);
      setTimeout(() => setCopiouTudo(false), 2000);
    } else {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-foreground/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 z-[61] w-full sm:max-w-md bg-background border-l border-border shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground p-4 sm:p-5">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/85">
                      Receita acumulativa
                    </p>
                    <h3 className="text-lg font-extrabold leading-tight">
                      {itens.length} medicamento{itens.length === 1 ? "" : "s"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="shrink-0 h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {itens.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Nenhum medicamento na receita ainda.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use o botão "+ Receita" nos cards para adicionar.
                  </p>
                </div>
              ) : (
                itens.map((item, i) => {
                  const r = obterTextoReceita(item);
                  if (!r) return null;
                  return (
                    <motion.div
                      key={item.medId}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="relative rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold tabular-nums">
                            {i + 1}
                          </span>
                          <p className="font-extrabold text-sm text-foreground leading-tight">
                            {r.titulo}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemover(item.medId)}
                          aria-label="Remover"
                          className="shrink-0 h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-[12px] text-foreground/85 leading-relaxed pl-8">
                        {r.texto}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer com ações */}
            {itens.length > 0 && (
              <div className="border-t border-border bg-card p-3 sm:p-4 space-y-2">
                <button
                  type="button"
                  onClick={handleCopiarTudo}
                  className={`w-full h-12 rounded-xl text-sm font-extrabold border flex items-center justify-center gap-2 transition-all shadow-card ${
                    copiouTudo
                      ? "bg-success text-success-foreground border-success"
                      : "bg-primary text-primary-foreground border-primary hover:bg-primary/90 active:scale-[0.98]"
                  }`}
                >
                  {copiouTudo ? (
                    <>
                      <Check className="h-4 w-4" /> Receita completa copiada!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-4 w-4" /> Copiar receita completa
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Limpar todos os medicamentos da receita?")) {
                      onLimpar();
                      toast.success("Receita limpa.");
                    }
                  }}
                  className="w-full h-9 rounded-xl text-xs font-bold border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpar receita
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// =====================================================================================
// PÁGINA PRINCIPAL
// =====================================================================================

export default function MementoPrescricaoPage() {
  const [selecao, setSelecao] = useState<Selecao>(null);
  const [busca, setBusca] = useState("");
  const [copied, setCopied] = useState<CopyState>(null);
  const [selPorMed, setSelPorMed] = useState<SelecaoPorMed>({});
  const [receita, setReceita] = useState<ItemReceita[]>([]);
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    setBusca("");
    setCopied(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selecao]);

  const categoriaInfo = useMemo(
    () =>
      selecao && selecao !== "todos"
        ? CATEGORIAS_MEMENTO.find((c) => c.key === selecao) ?? null
        : null,
    [selecao],
  );

  const medicamentosFiltrados = useMemo(() => {
    if (!selecao) return [];
    const termo = busca.trim().toLowerCase();
    return MEDICAMENTOS_MEMENTO.filter((m) => {
      if (selecao !== "todos" && !m.categorias.includes(selecao)) return false;
      if (!termo) return true;
      const haystack = [
        m.nome,
        m.principioAtivo,
        m.indicacao,
        m.apresentacao,
        ...m.posologias.map((p) => `${p.rotulo} ${p.resumo}`),
        ...(m.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(termo);
    });
  }, [selecao, busca]);

  const idsNaReceita = useMemo(() => new Set(receita.map((r) => r.medId)), [receita]);

  const handleCopy = async (med: MedicamentoMemento, field: "nome" | "receita") => {
    const sel = selPorMed[med.id] ?? { posologiaIdx: 0, intervaloIdx: 0 };
    const posologiaAtiva = med.posologias[sel.posologiaIdx] ?? med.posologias[0];
    const intervaloAtivo =
      posologiaAtiva.intervalos && posologiaAtiva.intervalos.length > 0
        ? posologiaAtiva.intervalos[Math.min(sel.intervaloIdx, posologiaAtiva.intervalos.length - 1)]
        : null;
    const textoReceita = aplicarIntervalo(posologiaAtiva.textoReceita, intervaloAtivo, "texto");
    const text = field === "nome" ? med.nome : textoReceita;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied({ id: med.id, field });
      const sufixo = intervaloAtivo ? ` · ${intervaloAtivo.rotulo}` : "";
      toast.success(
        field === "nome"
          ? `"${med.nome}" copiado!`
          : `Posologia (${posologiaAtiva.rotulo}${sufixo}) copiada.`,
      );
      setTimeout(() => setCopied(null), 1800);
    } else {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleSelecionarPosologia = (id: string, idx: number) => {
    setSelPorMed((prev) => ({ ...prev, [id]: { posologiaIdx: idx, intervaloIdx: 0 } }));
  };

  const handleSelecionarIntervalo = (id: string, idx: number) => {
    setSelPorMed((prev) => ({
      ...prev,
      [id]: { posologiaIdx: prev[id]?.posologiaIdx ?? 0, intervaloIdx: idx },
    }));
  };

  const handleAdicionarReceita = (med: MedicamentoMemento) => {
    const sel = selPorMed[med.id] ?? { posologiaIdx: 0, intervaloIdx: 0 };
    setReceita((prev) => {
      const existe = prev.findIndex((r) => r.medId === med.id);
      if (existe >= 0) {
        const novo = [...prev];
        novo[existe] = { medId: med.id, ...sel };
        toast.success(`"${med.nome}" atualizado na receita.`, {
          position: "bottom-center",
          duration: 1800,
        });
        return novo;
      }
      toast.success(`"${med.nome}" adicionado à receita.`, {
        position: "bottom-center",
        duration: 1800,
      });
      return [...prev, { medId: med.id, ...sel }];
    });
    // Abre o drawer lateral pra mostrar o resumo da receita
    setDrawerAberto(true);
  };

  const handleRemover = (medId: string) => {
    setReceita((prev) => prev.filter((r) => r.medId !== medId));
  };

  const handleLimpar = () => {
    setReceita([]);
  };

  // ============================================================
  // TELA 1: SELEÇÃO DE PATOLOGIA
  // ============================================================
  if (!selecao) {
    return (
      <>
        <div className="space-y-6">
          {/* Hero — compacto, clínico, prático */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-primary/18 bg-card ring-1 ring-primary/6 ring-offset-0 shadow-[0_1px_0_0_hsl(var(--background)/0.6)_inset,0_1px_2px_-1px_hsl(var(--foreground)/0.06),0_6px_12px_-4px_hsl(var(--foreground)/0.07),0_12px_24px_-10px_hsl(var(--primary)/0.16),0_2px_4px_0_hsl(var(--primary)/0.04)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent"
          >
            {/* Acento lateral azul (faixa esquerda) — identidade clínica discreta */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-primary/70" />

            <div className="relative p-4 sm:p-5 pl-5 sm:pl-7">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Identidade compacta */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-sm ring-1 ring-primary/30">
                    <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary leading-none">
                      Memento Médico · Mantecorp Farmasa
                    </p>
                    <h2 className="text-base sm:text-xl font-extrabold text-foreground leading-tight mt-1">
                      Auxiliar de Prescrição
                    </h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                      Selecione patologia · escolha posologia · monte a receita.
                    </p>
                  </div>
                </div>

                {/* Indicadores em chips inline (à direita no desktop, embaixo no mobile) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/25 px-2.5 py-1 text-[11px] font-extrabold text-primary tabular-nums shadow-sm">
                    <ClipboardList className="h-3 w-3" />
                    <span className="tabular-nums">{CATEGORIAS_MEMENTO.length}</span>
                    <span className="hidden sm:inline">patologias</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/30 px-2.5 py-1 text-[11px] font-extrabold text-accent tabular-nums shadow-sm">
                    <Pill className="h-3 w-3" />
                    <span className="tabular-nums">{TOTAL_MEDICAMENTOS}</span>
                    <span className="hidden sm:inline">medicamentos</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums shadow-sm transition-colors ${
                    receita.length > 0
                      ? "bg-success/12 border border-success/35 text-success"
                      : "bg-muted/60 border border-border text-muted-foreground"
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="tabular-nums">{receita.length}</span>
                    <span className="hidden sm:inline">na receita</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card "Todos os Medicamentos" */}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, scale: 1.005 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelecao("todos")}
            className="w-full text-left rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-primary/5 p-4 sm:p-5 ring-1 ring-accent/10 ring-offset-0 shadow-[0_1px_0_0_hsl(var(--background)/0.6)_inset,0_1px_2px_-1px_hsl(var(--foreground)/0.06),0_8px_16px_-6px_hsl(var(--foreground)/0.08),0_18px_36px_-12px_hsl(var(--accent)/0.22),0_2px_4px_0_hsl(var(--accent)/0.05)] hover:ring-accent/18 hover:border-accent/45 hover:shadow-[0_1px_0_0_hsl(var(--background)/0.7)_inset,0_2px_4px_-1px_hsl(var(--foreground)/0.08),0_14px_28px_-8px_hsl(var(--foreground)/0.10),0_28px_56px_-16px_hsl(var(--accent)/0.34),0_4px_8px_0_hsl(var(--accent)/0.12)] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/50 before:to-transparent"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-accent to-warning text-accent-foreground flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Library className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
                  Pesquisa geral
                </p>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-tight">
                  Todos os Medicamentos
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                  Busque por nome, princípio ativo ou apresentação em todo o portfólio.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[11px] font-extrabold tabular-nums">
                  <Pill className="h-3 w-3" />
                  {TOTAL_MEDICAMENTOS}
                </span>
                <span className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground group-hover:bg-accent/90">
                  <Search className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.button>

          {/* Instrução */}
          <div className="text-center space-y-1 px-2 pt-2">
            <h3 className="text-base sm:text-lg font-extrabold text-foreground flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              Ou selecione a patologia do paciente
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Toque no quadro clínico para ver a lista de medicamentos.
            </p>
          </div>

          {/* Grid de patologias */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIAS_MEMENTO.map((cat, i) => {
              const count = contarPorCategoria(cat.key);
              return (
                <motion.button
                  key={cat.key}
                  type="button"
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 220, damping: 22 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelecao(cat.key)}
                  className="group relative flex flex-col justify-between rounded-2xl bg-card border border-primary/15 ring-1 ring-primary/5 ring-offset-0 hover:border-primary/35 hover:ring-primary/12 p-4 sm:p-5 min-h-[180px] sm:min-h-[210px] text-left overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-[0_1px_0_0_hsl(var(--background)/0.6)_inset,0_1px_2px_-1px_hsl(var(--foreground)/0.06),0_8px_16px_-6px_hsl(var(--foreground)/0.08),0_18px_36px_-12px_hsl(var(--primary)/0.18),0_2px_4px_0_hsl(var(--primary)/0.04)] hover:shadow-[0_1px_0_0_hsl(var(--background)/0.7)_inset,0_2px_4px_-1px_hsl(var(--foreground)/0.08),0_14px_28px_-8px_hsl(var(--foreground)/0.10),0_28px_56px_-16px_hsl(var(--primary)/0.30),0_4px_8px_0_hsl(var(--primary)/0.10)] before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/8 group-hover:via-primary/0 group-hover:to-accent/12 transition-all duration-300" />

                  <div className="relative flex items-start justify-between">
                    <div className="text-3xl sm:text-4xl drop-shadow group-hover:scale-110 transition-transform duration-300">
                      {cat.icone}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-extrabold tabular-nums">
                      <Pill className="h-3 w-3" />
                      {count}
                    </span>
                  </div>

                  <div className="relative mt-3 flex-1">
                    <h4 className="text-[13px] sm:text-sm font-extrabold uppercase tracking-tight leading-tight text-foreground">
                      {cat.label}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-3">
                      {cat.abordagem}
                    </p>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 group-hover:text-primary transition-colors">
                      Ver medicamentos
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Material destinado exclusivamente a profissionais da saúde
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Memento adaptado de{" "}
              <span className="font-semibold text-foreground">
                Mantecorp Farmasa · Pronto Atendimento 2026
              </span>
              . Sempre revisar a posologia com a bula oficial e o quadro clínico
              do paciente antes de prescrever.
            </p>
          </div>
        </div>

        {/* Floating button da receita (sempre que houver itens) */}
        <FloatingReceitaButton
          count={receita.length}
          onClick={() => setDrawerAberto(true)}
        />
        <ReceitaDrawer
          open={drawerAberto}
          onClose={() => setDrawerAberto(false)}
          itens={receita}
          onRemover={handleRemover}
          onLimpar={handleLimpar}
        />
      </>
    );
  }

  // ============================================================
  // TELA 2: LISTA DE MEDICAMENTOS
  // ============================================================
  const isTodos = selecao === "todos";
  const tituloSecao = isTodos ? "Todos os Medicamentos" : categoriaInfo?.label ?? "";
  const iconeSecao = isTodos ? "📚" : categoriaInfo?.icone ?? "💊";
  const abordagemSecao = isTodos
    ? "Pesquisa em todo o portfólio Mantecorp Farmasa de Pronto Atendimento."
    : categoriaInfo?.abordagem;

  return (
    <>
      <div className="space-y-4 pb-24">
        <motion.div
          key={String(selecao)}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-1 pb-3 bg-background/85 backdrop-blur-md border-b border-border/40"
        >
          <button
            type="button"
            onClick={() => setSelecao(null)}
            className="group inline-flex items-center gap-2 mb-3 rounded-full bg-primary/8 hover:bg-primary/15 border border-primary/25 hover:border-primary/45 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-primary transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 group-hover:bg-primary/25 group-hover:-translate-x-0.5 transition-all">
              <ArrowLeft className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>{isTodos ? "Voltar ao menu" : "Trocar patologia"}</span>
          </button>

          <HeaderSecao
            icone={iconeSecao}
            titulo={tituloSecao}
            abordagem={abordagemSecao}
            count={medicamentosFiltrados.length}
            isTodos={isTodos}
          />

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={
                isTodos
                  ? "Buscar em todos os medicamentos..."
                  : "Buscar nesta patologia..."
              }
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-card text-foreground placeholder:text-muted-foreground text-sm border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {medicamentosFiltrados.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 px-4"
            >
              <p className="text-sm text-muted-foreground font-medium">
                {busca
                  ? `Nenhum medicamento encontrado para "${busca}".`
                  : "Nenhum medicamento cadastrado nesta patologia ainda."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`list-${String(selecao)}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch"
            >
              {medicamentosFiltrados.map((med, i) => {
                const sel = selPorMed[med.id] ?? { posologiaIdx: 0, intervaloIdx: 0 };
                return (
                  <MedicamentoCard
                    key={med.id}
                    med={med}
                    index={i}
                    copied={copied}
                    posologiaSelecionadaIdx={sel.posologiaIdx}
                    intervaloSelecionadoIdx={sel.intervaloIdx}
                    jaNaReceita={idsNaReceita.has(med.id)}
                    onSelecionarPosologia={handleSelecionarPosologia}
                    onSelecionarIntervalo={handleSelecionarIntervalo}
                    onCopy={handleCopy}
                    onAdicionarReceita={handleAdicionarReceita}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão Voltar no rodapé — mesma identidade do topo, mais visível */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => {
              setSelecao(null);
              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/85 hover:from-primary/95 hover:to-primary/75 border-2 border-primary/40 px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 group-hover:bg-primary-foreground/30 group-hover:-translate-x-0.5 transition-all">
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            </span>
            <span>{isTodos ? "Voltar ao menu" : "Trocar patologia"}</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground pt-2 leading-relaxed px-4">
          Material destinado exclusivamente a profissionais da saúde · Mantecorp Farmasa
        </p>
      </div>

      {/* Floating button da receita */}
      <FloatingReceitaButton
        count={receita.length}
        onClick={() => setDrawerAberto(true)}
      />
      <ReceitaDrawer
        open={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        itens={receita}
        onRemover={handleRemover}
        onLimpar={handleLimpar}
      />
    </>
  );
}

/** Botão flutuante da receita acumulativa. */
function FloatingReceitaButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-5 right-5 z-50 h-14 px-5 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-extrabold shadow-elevated flex items-center gap-2 border-2 border-white/20 hover:shadow-2xl transition-shadow"
          aria-label={`Ver receita com ${count} medicamentos`}
        >
          <FileText className="h-5 w-5" />
          <span>Receita</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary text-xs font-extrabold tabular-nums">
            {count}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
