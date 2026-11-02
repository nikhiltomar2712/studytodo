"use client"

import * as React from "react"
import {
  CircleDot,
  CheckCircle2,
  Clock3,
  ListTodo,
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/hooks/use-study-store"
import type { Task, TaskPriority, TaskStatus } from "@/lib/types"
import { toast } from "sonner"

const COLUMNS: {
  id: TaskStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: "todo", label: "To Do", icon: ListTodo },
  { id: "doing", label: "In Progress", icon: CircleDot },
  { id: "done", label: "Done", icon: CheckCircle2 },
]

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/40",
}

function QuickAdd({ column }: { column: TaskStatus }) {
  const { addTask } = useStudyStore()
  const [value, setValue] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    addTask(title, column, "medium")
    setValue("")
  }

  return (
    <form onSubmit={submit} className="mb-2">
      <label className="sr-only" htmlFor={`quick-add-${column}`}>
        Add a task to {column}
      </label>
      <div className="flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1.5 transition-colors focus-within:border-primary/50">
        <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id={`quick-add-${column}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          maxLength={200}
        />
        {value.trim() && (
          <button
            type="submit"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Add
          </button>
        )}
      </div>
    </form>
  )
}

function TaskCard({
  task,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
}: {
  task: Task
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onEdit: () => void
}) {
  const { moveTask, updateTask, deleteTask } = useStudyStore()

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow active:cursor-grabbing",
        dragging && "sf-dragging"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 text-sm font-medium leading-snug",
            task.status === "done" && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-60 group-hover:opacity-100"
              aria-label={`Options for ${task.title}`}
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Move to</DropdownMenuLabel>
            {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => moveTask(task.id, c.id)}>
                <c.icon className="mr-2 size-4" />
                {c.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                deleteTask(task.id)
                toast("Task deleted")
              }}
            >
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.notes && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {task.notes}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <span
          className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])}
          title={`${task.priority} priority`}
          aria-hidden
        />
        <span className="text-[10px] capitalize text-muted-foreground">
          {task.priority}
        </span>
        <button
          type="button"
          onClick={() => updateTask(task.id, { starred: !task.starred })}
          className={cn(
            "ml-auto rounded p-0.5 transition-colors",
            task.starred
              ? "text-orange-500"
              : "text-muted-foreground/40 hover:text-orange-400"
          )}
          aria-pressed={task.starred}
          aria-label={task.starred ? "Remove from today's goals" : "Mark as today's goal"}
          title={task.starred ? "Today's goal" : "Mark as today's goal"}
        >
          <Star className={cn("size-3.5", task.starred && "fill-orange-400")} />
        </button>
      </div>
    </div>
  )
}

function EditTaskDialog({
  task,
  onOpenChange,
}: {
  task: Task | null
  onOpenChange: (open: boolean) => void
}) {
  const { updateTask } = useStudyStore()
  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [priority, setPriority] = React.useState<TaskPriority>("medium")
  const [starred, setStarred] = React.useState(false)

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes)
      setPriority(task.priority)
      setStarred(task.starred)
    }
  }, [task])

  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update details or change priority.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-notes">Notes (optional)</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details, page numbers, links…"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Today&apos;s goal</Label>
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                <Checkbox
                  checked={starred}
                  onCheckedChange={(v) => setStarred(v === true)}
                  aria-label="Mark as today's goal"
                />
                <Star
                  className={cn(
                    "size-3.5",
                    starred ? "fill-orange-400 text-orange-500" : "text-muted-foreground"
                  )}
                />
                Highlight
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              if (!task) return
              updateTask(task.id, {
                title: title.trim(),
                notes: notes.trim(),
                priority,
                starred,
              })
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TasksView() {
  const { data, moveTask, clearCompletedTasks } = useStudyStore()
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState<TaskStatus | null>(null)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)

  const byColumn = React.useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] }
    for (const t of data.tasks) map[t.status].push(t)
    // starred goals first, then newest
    const sort = (a: Task, b: Task) =>
      Number(b.starred) - Number(a.starred) || b.createdAt - a.createdAt
    map.todo.sort(sort)
    map.doing.sort(sort)
    map.done.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    return map
  }, [data.tasks])

  const total = data.tasks.length
  const done = byColumn.done.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const starredOpen = data.tasks.filter((t) => t.starred && t.status !== "done").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A lightweight board for study topics and daily learning goals.
            {starredOpen > 0 && (
              <>
                {" "}
                <span className="font-medium text-orange-500">
                  {starredOpen} goal{starredOpen === 1 ? "" : "s"} starred for today
                </span>
                .
              </>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCompletedTasks}
          disabled={done === 0}
          className="text-muted-foreground"
        >
          <Trash2 className="mr-2 size-4" /> Clear done ({done})
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const tasks = byColumn[col.id]
          return (
            <Card
              key={col.id}
              className={cn(
                "gap-0 bg-muted/40 py-0 transition-colors",
                dragOver === col.id && "sf-drop-active bg-primary/[0.04]"
              )}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                setDragOver(col.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(null)
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData("text/plain") || dragId
                if (id) moveTask(id, col.id)
                setDragOver(null)
                setDragId(null)
              }}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <col.icon
                    className={cn(
                      "size-4",
                      col.id === "done" ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  {col.label}
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                    {tasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <QuickAdd column={col.id} />
                <div className="max-h-[52vh] space-y-2 overflow-y-auto sf-scroll pr-1">
                  {tasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                      {col.id === "todo"
                        ? "Add study topics above"
                        : col.id === "doing"
                          ? "Drag a task here while working on it"
                          : "Completed goals land here"}
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        dragging={dragId === task.id}
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setDragOver(null)
                        }}
                        onEdit={() => setEditingTask(task)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {total > 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden />
          {done} of {total} tasks complete ({pct}%)
        </p>
      )}

      <EditTaskDialog task={editingTask} onOpenChange={(o) => !o && setEditingTask(null)} />
    </div>
  )
}
