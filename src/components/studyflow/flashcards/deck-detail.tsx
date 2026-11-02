"use client"

import * as React from "react"
import {
  ArrowLeft,
  GraduationCap,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { cardsOfDeck, deckStats, useStudyStore } from "@/hooks/use-study-store"
import { formatShortDate } from "@/lib/date-utils"
import { describeDue, isMature, isNew } from "@/lib/srs"
import { toPlainText } from "@/lib/markdown"
import type { Deck, Flashcard } from "@/lib/types"
import { DECK_DOT_CLASS } from "../deck-colors"
import { CardFormDialog } from "./card-form"
import { DeckFormDialog } from "./deck-form"

function DueChip({ card, now }: { card: Flashcard; now: number }) {
  if (isNew(card)) {
    return (
      <Badge variant="outline" className="rounded-full text-[10px] text-primary border-primary/40">
        New
      </Badge>
    )
  }
  if (isMature(card)) {
    return (
      <Badge variant="outline" className="rounded-full text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
        Matured
      </Badge>
    )
  }
  if (card.dueAt <= now) {
    return (
      <Badge className="rounded-full text-[10px]">Due</Badge>
    )
  }
  return (
    <Badge variant="secondary" className="rounded-full text-[10px]">
      {describeDue(card.dueAt, now)}
    </Badge>
  )
}

export function DeckDetail({
  deck,
  onBack,
  onStartReview,
}: {
  deck: Deck
  onBack: () => void
  onStartReview: (deckId: string) => void
}) {
  const { data, addCard, updateCard, deleteCard, resetCardProgress } = useStudyStore()
  const [cardFormOpen, setCardFormOpen] = React.useState(false)
  const [editingCard, setEditingCard] = React.useState<Flashcard | null>(null)
  const [editDeckOpen, setEditDeckOpen] = React.useState(false)
  const [deletingCard, setDeletingCard] = React.useState<Flashcard | null>(null)

  const cards = React.useMemo(() => cardsOfDeck(data, deck.id), [data, deck.id])
  const stats = React.useMemo(() => deckStats(data, deck.id), [data, deck.id])
  const now = Date.now()

  const deckOptions = React.useMemo(
    () => data.decks.map((d) => ({ id: d.id, name: d.name })),
    [data.decks]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 size-4" /> All decks
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "size-4 rounded-full",
                DECK_DOT_CLASS[deck.color] ?? "bg-primary"
              )}
              aria-hidden
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
              {deck.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {deck.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onStartReview(deck.id)} disabled={stats.due === 0}>
              <GraduationCap className="mr-2 size-4" />
              Study {stats.due > 0 ? `(${stats.due} due)` : ""}
            </Button>
            <Button variant="outline" onClick={() => setCardFormOpen(true)}>
              <Plus className="mr-2 size-4" /> Add card
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditDeckOpen(true)} aria-label="Edit deck">
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stats.total} cards
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stats.due} due
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stats.matured} matured
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stats.masteryPct}% mastery
          </Badge>
        </div>
      </div>

      {/* Card list */}
      {cards.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Plus className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">This deck is empty</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first flashcard — a question on the front, the answer on
              the back.
            </p>
          </div>
          <Button onClick={() => setCardFormOpen(true)}>
            <Plus className="mr-2 size-4" /> Add card
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1fr_1fr_120px_100px_44px] gap-3 border-b bg-muted/50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Front</span>
            <span>Back</span>
            <span>Status</span>
            <span>Interval</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="max-h-[62vh] divide-y overflow-y-auto sf-scroll">
            {cards.map((card) => (
              <li
                key={card.id}
                className="grid gap-2 px-4 py-3 transition-colors hover:bg-muted/40 lg:grid-cols-[1fr_1fr_120px_100px_44px] lg:items-center lg:gap-3"
              >
                <p className="min-w-0 truncate text-sm font-medium">
                  {toPlainText(card.front)}
                </p>
                <p className="min-w-0 truncate text-sm text-muted-foreground">
                  {toPlainText(card.back)}
                </p>
                <div className="flex items-center gap-1.5">
                  <DueChip card={card} now={now} />
                  {card.tags.slice(0, 1).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="hidden rounded-full text-[10px] xl:inline-flex"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {card.intervalDays > 0
                    ? `${card.intervalDays < 1 ? `${Math.round(card.intervalDays * 24)}h` : `${Math.round(card.intervalDays)}d`}`
                    : "—"}
                </span>
                <div className="flex justify-start lg:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Card options: ${card.front.slice(0, 40)}`}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCard(card)
                          setCardFormOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Edit card
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => resetCardProgress(card.id)}>
                        <RotateCcw className="mr-2 size-4" /> Reset progress
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingCard(card)}
                      >
                        <Trash2 className="mr-2 size-4" /> Delete card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="col-span-full text-[10px] text-muted-foreground/70 lg:hidden">
                  Added {formatShortDate(card.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Card create/edit dialog */}
      <CardFormDialog
        open={cardFormOpen}
        onOpenChange={(o) => {
          setCardFormOpen(o)
          if (!o) setEditingCard(null)
        }}
        decks={deckOptions}
        deckId={deck.id}
        card={editingCard ?? undefined}
        onSave={(values) => {
          if (editingCard) {
            updateCard(editingCard.id, values)
          } else {
            addCard(values.deckId, values.front, values.back, values.tags)
          }
        }}
      />

      {/* Deck edit dialog */}
      <DeckFormDialog
        open={editDeckOpen}
        onOpenChange={setEditDeckOpen}
        deck={deck}
        onSave={(values) => updateDeck(deck.id, values)}
      />

      {/* Delete card confirmation */}
      <AlertDialog
        open={deletingCard !== null}
        onOpenChange={(o) => !o && setDeletingCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              Its review history will be removed as well. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingCard) deleteCard(deletingCard.id)
                setDeletingCard(null)
              }}
            >
              Delete card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
