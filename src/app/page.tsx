"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { GraduationCap } from "lucide-react"
import {
  StudyStoreProvider,
  useStudyStore,
} from "@/hooks/use-study-store"
import { PomodoroProvider } from "@/hooks/use-pomodoro"
import { AppShell } from "@/components/studyflow/app-shell"
import { Dashboard } from "@/components/studyflow/dashboard"
import { FlashcardsView } from "@/components/studyflow/flashcards/flashcards-view"
import { TimerView } from "@/components/studyflow/timer-view"
import { TasksView } from "@/components/studyflow/tasks-view"
import { NotesView } from "@/components/studyflow/notes-view"
import type { FlashcardsIntent, View } from "@/lib/types"

function Splash() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="size-6" aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">Loading StudyFlow…</p>
      </div>
    </div>
  )
}

function AppRoot() {
  const { hydrated } = useStudyStore()
  const [view, setView] = React.useState<View>("dashboard")
  const [fcIntent, setFcIntent] = React.useState<FlashcardsIntent | null>(null)

  const navigate = React.useCallback((next: View) => {
    setView(next)
  }, [])

  const startFlashcardsIntent = React.useCallback(
    (intent: FlashcardsIntent) => {
      setFcIntent({ ...intent }) // new identity so the effect always re-runs
      setView("flashcards")
    },
    []
  )

  // Reset scroll when switching views.
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  if (!hydrated) {
    return <Splash />
  }

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return (
          <Dashboard onNavigate={navigate} onFlashcardsIntent={startFlashcardsIntent} />
        )
      case "flashcards":
        return (
          <FlashcardsView
            intent={fcIntent}
            onIntentHandled={() => setFcIntent(null)}
          />
        )
      case "timer":
        return <TimerView />
      case "tasks":
        return <TasksView />
      case "notes":
        return <NotesView />
      default:
        return null
    }
  }

  return (
    <AppShell activeView={view} onNavigate={navigate}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}

export default function Home() {
  return (
    <StudyStoreProvider>
      <PomodoroProvider>
        <AppRoot />
      </PomodoroProvider>
    </StudyStoreProvider>
  )
}
