"use client"

import * as React from "react"
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  RotateCw,
  Undo2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/hooks/use-study-store"
import {
  formatIntervalDays,
  previewInterval,
  shuffled,
} from "@/lib/srs"
import type { Flashcard, Rating } from "@/lib/types"
import { FlipCard } from "./flip-card"

const RATING_ORDER: Rating[] = ["again", "hard", "good", "easy"]

const RATING_META: Record<
  Rating,
  { label: string; key: string; buttonClass: string; dotClass: string }
> = {
  again: {
    label: "Again",
    key: "1",
    buttonClass:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400",
    dotClass: "bg-rose-500",
  },
  hard: {
    label: "Hard",
    key: "2",
    buttonClass:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  good: {
    label: "Good",
    key: "3",
    buttonClass:
      "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
    dotClass: "bg-primary",
  },
  easy: {
    label: "Easy",
    key: "4",
    buttonClass:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
}

function mmss(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function ReviewSession({
  deckId,
  onExit,
}: {
  deckId: string | null
  onExit: () => void
}) {
  const { data, reviewCard } = useStudyStore()

  /* ---- Build the initial queue once per session ---- */
  const [queue, setQueue] = React.useState<string[]>(() => {
    const pool = deckId
      ? data.cards.filter((c) => c.deckId === deckId && c.dueAt <= Date.now())
      : data.cards.filter((c) => c.dueAt <= Date.now())
    // Oldest due first, with a light shuffle among same-moment cards.
    return shuffled(pool.sort((a, b) => a.dueAt - b.dueAt)).map((c) => c.id)
  })
  const initialCount = React.useRef(queue.length)
  const [ahead, setAhead] = React.useState(false)
  const [currentId, setCurrentId] = React.useState<string | null>(
    () => queue[0] ?? null
  )
  const [flipped, setFlipped] = React.useState(false)
  const [startedAt] = React.useState(() => Date.now())
  const [counts, setCounts] = React.useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })

  const current: Flashcard | null = React.useMemo(
    () => data.cards.find((c) => c.id === currentId) ?? null,
    [data.cards, currentId]
  )

  const deckName = React.useMemo(() => {
    if (!deckId) return "All decks"
    return data.decks.find((d) => d.id === deckId)?.name ?? "Deck"
  }, [data.decks, deckId])

  const totalRated = counts.again + counts.hard + counts.good + counts.easy

  /* ---- Actions ---- */
  const startAhead = () => {
    const pool = deckId
      ? data.cards.filter((c) => c.deckId === deckId)
      : data.cards
    const ids = shuffled(pool).map((c) => c.id)
    setQueue(ids)
    initialCount.current = ids.length
    setCurrentId(ids[0] ?? null)
    setAhead(true)
    setFlipped(false)
  }

  const rate = (rating: Rating) => {
    if (!current) return
    reviewCard(current.id, rating)
    setCounts((c) => ({ ...c, [rating]: c[rating] + 1 }))
    setFlipped(false)
    const rest = queue.slice(1)
    // "Again" cards come back at the end of this session.
    const next = rating === "again" ? [...rest, current.id] : rest
    setQueue(next)
    setCurrentId(next[0] ?? null)
  }

  /* ---- Reset flip when the card changes ---- */
  React.useEffect(() => {
    setFlipped(false)
  }, [currentId])

  /* ---- Keyboard shortcuts ---- */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (!flipped && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault()
        setFlipped(true)
        return
      }
      if (flipped) {
        const idx = ["1", "2", "3", "4"].indexOf(e.key)
        if (idx >= 0) {
          e.preventDefault()
          rate(RATING_ORDER[idx])
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
     
  }, [flipped, current])

  /* ---- Session complete state ---- */
  if (!current) {
    const accuracy =
      totalRated > 0
        ? Math.round(((counts.good + counts.easy) / totalRated) * 100)
        : 0

    if (totalRated === 0 && !ahead) {
      // Nothing was due when the session opened.
      const aheadPool = deckId
        ? data.cards.filter((c) => c.deckId === deckId)
        : data.cards
      return (
        <div className="mx-auto max-w-md space-y-6 py-10 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              All caught up
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              No cards are scheduled for review in{" "}
              <span className="font-medium text-foreground">{deckName}</span>{" "}
              right now. Come back later, or study ahead to get extra practice.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {aheadPool.length > 0 && (
              <Button onClick={startAhead}>
                <GraduationCap className="mr-2 size-4" />
                Study ahead ({aheadPool.length})
              </Button>
            )}
            <Button variant="outline" onClick={onExit}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-md space-y-6 py-10 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Session complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalRated} review{totalRated === 1 ? "" : "s"} in{" "}
            {mmss(Date.now() - startedAt)} · {accuracy}% recalled with ease
          </p>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {RATING_ORDER.map((r) => (
              <div key={r} className="text-center">
                <div
                  className={cn(
                    "mx-auto mb-1 size-2 rounded-full",
                    RATING_META[r].dotClass
                  )}
                  aria-hidden
                />
                <div className="text-lg font-bold tabular-nums">
                  {counts[r]}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {RATING_META[r].label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-center gap-2">
          <Button onClick={onExit}>
            <ArrowLeft className="mr-2 size-4" /> Back to decks
          </Button>
        </div>
      </div>
    )
  }

  /* ---- Active review ---- */
  const progressPct =
    initialCount.current > 0
      ? Math.max(
          0,
          Math.min(100, ((initialCount.current - queue.length) / initialCount.current) * 100)
        )
      : 0

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onExit}
            aria-label="Exit review session"
          >
            <X className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{deckName}</p>
            <p className="text-[11px] text-muted-foreground">
              {ahead ? "Study-ahead mode · " : ""}
              {totalRated} reviewed{queue.length > 1 ? ` · ${queue.length} in queue` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {RATING_ORDER.map((r) => (
            <span key={r} className="flex items-center gap-1" title={RATING_META[r].label}>
              <span className={cn("size-1.5 rounded-full", RATING_META[r].dotClass)} aria-hidden />
              {counts[r]}
            </span>
          ))}
        </div>
      </div>

      <Progress value={progressPct} className="h-1.5" aria-label="Session progress" />

      {/* The card */}
      <FlipCard
        key={current.id}
        front={current.front}
        back={current.back}
        tags={current.tags}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {/* Controls */}
      {!flipped ? (
        <Button
          className="h-12 w-full text-base font-semibold"
          onClick={() => setFlipped(true)}
        >
          Show answer
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sf-pop">
          {RATING_ORDER.map((rating) => {
            const meta = RATING_META[rating]
            return (
              <button
                key={rating}
                type="button"
                onClick={() => rate(rating)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  meta.buttonClass
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {rating === "again" && <RotateCw className="size-3.5" aria-hidden />}
                  {rating === "easy" && <Undo2 className="size-3.5 rotate-90" aria-hidden />}
                  {meta.label}
                  <kbd className="rounded border border-current/30 bg-background/40 px-1 text-[10px] font-medium opacity-70">
                    {meta.key}
                  </kbd>
                </span>
                <span className="text-[11px] tabular-nums opacity-80">
                  {previewInterval(current, rating)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        {flipped
          ? "Rate how well you recalled — 1 Again · 2 Hard · 3 Good · 4 Easy"
          : "Space to reveal the answer"}
      </p>
    </div>
  )
}
