"use client"

import * as React from "react"
import { GraduationCap, Layers, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
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
import { deckStats, dueCards, useStudyStore } from "@/hooks/use-study-store"
import type { Deck } from "@/lib/types"
import { DECK_DOT_CLASS } from "../deck-colors"
import { DeckFormDialog } from "./deck-form"

export function DeckList({
  onOpenDeck,
  onReviewAll,
  createOpen,
  onCreateOpenChange,
}: {
  onOpenDeck: (deckId: string) => void
  onReviewAll: () => void
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}) {
  const { data, addDeck, updateDeck, deleteDeck } = useStudyStore()
  const [editing, setEditing] = React.useState<Deck | null>(null)
  const [deleting, setDeleting] = React.useState<Deck | null>(null)

  const dueCount = React.useMemo(() => dueCards(data).length, [data])
  const totalCards = data.cards.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Flashcards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.decks.length} deck{data.decks.length === 1 ? "" : "s"} ·{" "}
            {totalCards} card{totalCards === 1 ? "" : "s"} ·{" "}
            <span className={cn(dueCount > 0 && "font-medium text-primary")}>
              {dueCount} due
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onReviewAll} disabled={dueCount === 0}>
            <GraduationCap className="mr-2 size-4" />
            Study all due
          </Button>
          <Button variant="outline" onClick={() => onCreateOpenChange(true)}>
            <Plus className="mr-2 size-4" />
            New deck
          </Button>
        </div>
      </div>

      {data.decks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="size-7" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">No decks yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                A deck is a set of flashcards studied with spaced repetition.
                Create your first one to get started.
              </p>
            </div>
            <Button onClick={() => onCreateOpenChange(true)}>
              <Plus className="mr-2 size-4" /> Create your first deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.decks.map((deck) => {
            const stats = deckStats(data, deck.id)
            return (
              <Card
                key={deck.id}
                className="group cursor-pointer gap-0 py-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                onClick={() => onOpenDeck(deck.id)}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "size-3 shrink-0 rounded-full",
                          DECK_DOT_CLASS[deck.color] ?? "bg-primary"
                        )}
                        aria-hidden
                      />
                      <CardTitle className="truncate text-base">
                        {deck.name}
                      </CardTitle>
                    </div>
                    <div
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Deck options for ${deck.name}`}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditing(deck)
                            }}
                          >
                            <Pencil className="mr-2 size-4" /> Edit deck
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleting(deck)
                            }}
                          >
                            <Trash2 className="mr-2 size-4" /> Delete deck
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {deck.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {deck.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="px-5 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{stats.total} cards</span>
                    <span aria-hidden>·</span>
                    <span>{stats.matured} matured</span>
                    {stats.due > 0 && (
                      <Badge className="ml-auto rounded-full text-[10px]">
                        {stats.due} due
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress
                      value={stats.masteryPct}
                      className="h-1.5"
                      aria-label={`${stats.masteryPct}% mastered`}
                    />
                    <span className="w-9 text-right text-[10px] tabular-nums text-muted-foreground">
                      {stats.masteryPct}%
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-5 py-3 text-[11px] text-muted-foreground">
                  {stats.due > 0
                    ? `${stats.due} card${stats.due === 1 ? "" : "s"} ready for review`
                    : stats.total > 0
                      ? "Nothing due — nice pacing"
                      : "Empty deck — add some cards"}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / edit deck dialog */}
      <DeckFormDialog
        open={createOpen || editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            onCreateOpenChange(false)
          }
        }}
        deck={editing ?? undefined}
        onSave={(values) => {
          if (editing) {
            updateDeck(editing.id, values)
          } else {
            addDeck(values.name, values.description, values.color)
          }
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deckStats(data, deleting.id).total > 0
                ? `This also deletes ${deckStats(data, deleting.id).total} card(s) and their review history in this deck. This cannot be undone.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteDeck(deleting.id)
                setDeleting(null)
              }}
            >
              Delete deck
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
