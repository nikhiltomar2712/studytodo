"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownContent } from "./markdown-content"

export interface CardFormValues {
  deckId: string
  front: string
  back: string
  tags: string[]
}

export function CardFormDialog({
  open,
  onOpenChange,
  decks,
  deckId,
  card,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  decks: { id: string; name: string }[]
  /** Pre-selected deck for new cards. */
  deckId: string
  /** When provided the dialog edits this card. */
  card?: { front: string; back: string; tags: string[] }
  onSave: (values: CardFormValues) => void
}) {
  const [targetDeck, setTargetDeck] = React.useState(deckId)
  const [front, setFront] = React.useState("")
  const [back, setBack] = React.useState("")
  const [tagsInput, setTagsInput] = React.useState("")
  const [preview, setPreview] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTargetDeck(card ? deckId : deckId)
      setFront(card?.front ?? "")
      setBack(card?.back ?? "")
      setTagsInput(card ? card.tags.join(", ") : "")
      setPreview(false)
    }
     
  }, [open, card, deckId])

  const valid = front.trim().length > 0 && back.trim().length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 6)
    onSave({ deckId: targetDeck, front: front.trim(), back: back.trim(), tags })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sf-scroll sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{card ? "Edit card" : "New flashcard"}</DialogTitle>
            <DialogDescription>
              Basic markdown is supported: **bold**, *italic*, `code`,
              ~~strike~~ and - lists.
            </DialogDescription>
          </DialogHeader>

          {decks.length > 1 && (
            <div className="space-y-1.5">
              <Label>Deck</Label>
              <Select value={targetDeck} onValueChange={setTargetDeck}>
                <SelectTrigger aria-label="Deck">
                  <SelectValue placeholder="Choose a deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="card-front">Front — question</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? <EyeOff className="mr-1 size-3.5" /> : <Eye className="mr-1 size-3.5" />}
                {preview ? "Edit" : "Preview"}
              </Button>
            </div>
            {preview ? (
              <div className="min-h-20 rounded-md border bg-muted/40 p-3 text-sm">
                <MarkdownContent text={front} />
              </div>
            ) : (
              <Textarea
                id="card-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="What does **photosynthesis** produce?"
                rows={3}
                maxLength={1000}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-back">Back — answer</Label>
            {preview ? (
              <div className="min-h-20 rounded-md border bg-muted/40 p-3 text-sm">
                <MarkdownContent text={back} />
              </div>
            ) : (
              <Textarea
                id="card-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Glucose and oxygen, using light energy..."
                rows={3}
                maxLength={2000}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-tags">Tags (comma separated)</Label>
            <Input
              id="card-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="biology, chapter-4"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              {card ? "Save changes" : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
