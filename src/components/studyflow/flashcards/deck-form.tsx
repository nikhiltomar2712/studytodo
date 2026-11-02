"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { DECK_COLORS, type Deck, type DeckColor } from "@/lib/types"
import { DECK_SWATCH_CLASS } from "../deck-colors"

const COLOR_LABELS: Record<DeckColor, string> = {
  emerald: "Emerald",
  teal: "Teal",
  amber: "Amber",
  orange: "Orange",
  rose: "Rose",
  violet: "Violet",
  cyan: "Cyan",
  lime: "Lime",
  fuchsia: "Fuchsia",
  slate: "Slate",
}

export function DeckFormDialog({
  open,
  onOpenChange,
  deck,
  defaultOpenCreate,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog edits this deck; otherwise it creates a new one. */
  deck?: Deck
  defaultOpenCreate?: boolean
  onSave: (values: { name: string; description: string; color: DeckColor }) => void
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState<DeckColor>("emerald")

  React.useEffect(() => {
    if (open) {
      setName(deck?.name ?? "")
      setDescription(deck?.description ?? "")
      setColor(deck?.color ?? "emerald")
    }
  }, [open, deck])

  const valid = name.trim().length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({ name: name.trim(), description: description.trim(), color })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{deck ? "Edit deck" : "New deck"}</DialogTitle>
            <DialogDescription>
              {deck
                ? "Rename this deck or change its appearance."
                : "Group related flashcards together, e.g. \u201cBiology — Chapter 4\u201d."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="deck-name">Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spanish vocabulary"
              autoFocus
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deck-desc">Description (optional)</Label>
            <Input
              id="deck-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this deck cover?"
              maxLength={140}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Deck color">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  onClick={() => setColor(c)}
                  title={COLOR_LABELS[c]}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg border transition-all hover:scale-105",
                    DECK_SWATCH_CLASS[c],
                    color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  )}
                >
                  {color === c && <Check className="size-4 text-foreground" aria-hidden />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              {deck ? "Save changes" : "Create deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
