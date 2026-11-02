/**
 * StudyFlow — static class maps for deck accent colors.
 * Kept as literal strings so Tailwind's scanner includes them in the build.
 */

import type { DeckColor } from "@/lib/types"

export const DECK_DOT_CLASS: Record<DeckColor, string> = {
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  lime: "bg-lime-500",
  fuchsia: "bg-fuchsia-500",
  slate: "bg-slate-500",
}

export const DECK_SWATCH_CLASS: Record<DeckColor, string> = {
  emerald: "bg-emerald-500/15 border-emerald-500/40",
  teal: "bg-teal-500/15 border-teal-500/40",
  amber: "bg-amber-500/15 border-amber-500/40",
  orange: "bg-orange-500/15 border-orange-500/40",
  rose: "bg-rose-500/15 border-rose-500/40",
  violet: "bg-violet-500/15 border-violet-500/40",
  cyan: "bg-cyan-500/15 border-cyan-500/40",
  lime: "bg-lime-500/15 border-lime-500/40",
  fuchsia: "bg-fuchsia-500/15 border-fuchsia-500/40",
  slate: "bg-slate-500/15 border-slate-500/40",
}
