"use client"

import * as React from "react"
import {
  Flame,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  RotateCcw,
  SquareKanban,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { computeStreak, useStudyStore } from "@/hooks/use-study-store"
import type { View } from "@/lib/types"
import { ThemeToggle } from "./theme-toggle"

export const NAV_ITEMS: {
  id: View
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "flashcards", label: "Flashcards", icon: GraduationCap },
  { id: "timer", label: "Focus Timer", icon: Timer },
  { id: "tasks", label: "Tasks", icon: SquareKanban },
  { id: "notes", label: "Notes", icon: NotebookPen },
]

function StreakChip() {
  const { data } = useStudyStore()
  const streak = React.useMemo(() => computeStreak(data.activity), [data.activity])

  if (streak <= 0) return null

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400"
      title="Current study streak"
    >
      <Flame className="size-3.5" aria-hidden />
      {streak} {streak === 1 ? "day" : "days"}
    </div>
  )
}

function SettingsMenu() {
  const { resetAllData } = useStudyStore()
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="Settings"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <RotateCcw className="mr-2 size-4" />
              Reset all data
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <DropdownMenuSeparator />
          <div className="px-2.5 py-1.5 text-xs text-muted-foreground">
            Everything is stored locally in your browser.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all StudyFlow data?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes all decks, cards, review history, focus
            sessions, tasks and notes from this browser. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              resetAllData()
            }}
          >
            Delete everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function NavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: (typeof NAV_ITEMS)[number]
  active: boolean
  onClick: () => void
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg text-sm transition-colors",
        compact
          ? "flex-col gap-1 px-2 py-1.5 text-[11px]"
          : "px-3 py-2.5 font-medium",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {!compact && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
            active ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      )}
      <Icon className={cn(compact ? "size-5" : "size-[18px]")} aria-hidden />
      {item.label}
    </button>
  )
}

export function AppShell({
  activeView,
  onNavigate,
  children,
}: {
  activeView: View
  onNavigate: (view: View) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 pb-4 pt-6">
          <div className="text-base font-bold tracking-tight">StudyFlow</div>
          <div className="text-[11px] text-muted-foreground">
            Focus. Learn. Retain.
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
        <div className="space-y-3 border-t px-4 py-4">
          <div className="flex items-center justify-between">
            <StreakChip />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SettingsMenu />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Local-first workspace — your data stays in this browser.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            className="flex items-center"
            onClick={() => onNavigate("dashboard")}
            aria-label="StudyFlow home"
          >
            <span className="text-base font-bold tracking-tight">
              StudyFlow
            </span>
          </button>
          <div className="flex items-center gap-1.5">
            <StreakChip />
            <ThemeToggle />
            <SettingsMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>

        {/* Sticky footer */}
        <footer className="mt-auto border-t bg-background/60 py-4 text-center text-xs text-muted-foreground md:pb-5">
          StudyFlow · Spaced repetition + focus, all saved locally in your
          browser — nothing leaves your device.
        </footer>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-0.5 px-3 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label.split(" ")[0]}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
