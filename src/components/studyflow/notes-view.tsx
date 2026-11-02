"use client"

import * as React from "react"
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStudyStore } from "@/hooks/use-study-store"
import type { Note } from "@/lib/types"
import { formatShortDate, formatTime } from "@/lib/date-utils"
import { toast } from "sonner"

function NoteDialog({
  note,
  open,
  onOpenChange,
}: {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addNote, updateNote } = useStudyStore()
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "")
      setContent(note?.content ?? "")
    }
  }, [open, note])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            A scratchpad for anything worth remembering — formulas, vocab,
            ideas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chemistry formulas"
              maxLength={120}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely…"
              rows={8}
              className="min-h-40"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              if (note) {
                updateNote(note.id, { title: title.trim(), content })
              } else {
                addNote(title.trim(), content)
              }
              onOpenChange(false)
            }}
          >
            {note ? "Save" : "Create note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NotesView() {
  const { data, deleteNote } = useStudyStore()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Note | null>(null)

  const notes = React.useMemo(
    () => [...data.notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [data.notes]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Quick Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length} note{notes.length === 1 ? "" : "s"} · saved
            automatically in this browser
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" /> New note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <NotebookPen className="size-7" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">No notes yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Keep short-lived snippets here — things that don&apos;t need a
                flashcard yet.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" /> Write your first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="group gap-0 py-0 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {note.title}
                  </h3>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Options for note ${note.title}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(note)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            deleteNote(note.id)
                            toast("Note deleted")
                          }}
                        >
                          <Trash2 className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {note.content || "Empty note"}
                </p>
                <p className="mt-3 border-t pt-2 text-[11px] text-muted-foreground/70">
                  Updated {formatShortDate(note.updatedAt)} at{" "}
                  {formatTime(note.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoteDialog
        note={editing}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
      />
    </div>
  )
}
