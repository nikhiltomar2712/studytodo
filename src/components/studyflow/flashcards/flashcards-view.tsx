"use client"

import * as React from "react"
import type { FlashcardsIntent } from "@/lib/types"
import { DeckList } from "./deck-list"
import { DeckDetail } from "./deck-detail"
import { ReviewSession } from "./review-session"
import { useStudyStore } from "@/hooks/use-study-store"

/**
 * Router inside the Flashcards view:
 *   DeckList → DeckDetail → ReviewSession
 * It also consumes cross-view intents (e.g. "review due now" from the Dashboard).
 */
export function FlashcardsView({
  intent,
  onIntentHandled,
}: {
  intent: FlashcardsIntent | null
  onIntentHandled: () => void
}) {
  const { data } = useStudyStore()
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState<{
    deckId: string | null
    session: number // bump to force a fresh session each time
  } | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  React.useEffect(() => {
    if (!intent) return
    if (intent.type === "review-due") {
      setSelectedDeckId(null)
      setReviewing({ deckId: intent.deckId ?? null, session: Date.now() })
    } else if (intent.type === "create-deck") {
      setSelectedDeckId(null)
      setReviewing(null)
      setCreateOpen(true)
    } else {
      setSelectedDeckId(null)
      setReviewing(null)
    }
    onIntentHandled()
     
  }, [intent])

  const selectedDeck = React.useMemo(
    () => data.decks.find((d) => d.id === selectedDeckId) ?? null,
    [data.decks, selectedDeckId]
  )

  if (reviewing) {
    return (
      <ReviewSession
        key={reviewing.session}
        deckId={reviewing.deckId}
        onExit={() => setReviewing(null)}
      />
    )
  }

  if (selectedDeck) {
    return (
      <DeckDetail
        deck={selectedDeck}
        onBack={() => setSelectedDeckId(null)}
        onStartReview={(deckId) =>
          setReviewing({ deckId, session: Date.now() })
        }
      />
    )
  }

  return (
    <DeckList
      onOpenDeck={setSelectedDeckId}
      onReviewAll={() => setReviewing({ deckId: null, session: Date.now() })}
      createOpen={createOpen}
      onCreateOpenChange={setCreateOpen}
    />
  )
}
