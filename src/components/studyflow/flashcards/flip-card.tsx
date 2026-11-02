"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MarkdownContent } from "./markdown-content"

/**
 * 3D flip card used in review sessions.
 * Both faces are stacked in the same grid cell, so the container height
 * always fits the taller face; the wrapper rotates on the Y axis.
 */
export function FlipCard({
  front,
  back,
  tags,
  flipped,
  onFlip,
}: {
  front: string
  back: string
  tags: string[]
  flipped: boolean
  onFlip: () => void
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onFlip()
    }
  }

  return (
    <div
      className="perspective-1200 w-full cursor-pointer select-none focus-visible:outline-none"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Show question" : "Reveal answer"}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "preserve-3d relative grid transition-transform duration-500",
          flipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front (question) */}
        <div className="backface-hidden [grid-area:1/1] flex min-h-[300px] flex-col rounded-2xl border bg-card p-6 shadow-sm sm:min-h-[340px] sm:p-8">
          <div className="flex min-h-6 flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-center text-center">
            <MarkdownContent
              text={front}
              className="text-lg font-medium leading-relaxed sm:text-xl"
            />
          </div>
          <div className="flex min-h-6 items-center justify-center">
            <span className="text-xs text-muted-foreground">
              Tap card or press Space to reveal
            </span>
          </div>
        </div>

        {/* Back (answer) */}
        <div className="backface-hidden rotate-y-180 [grid-area:1/1] flex min-h-[300px] flex-col rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 shadow-sm sm:min-h-[340px] sm:p-8">
          <div className="flex min-h-6 items-center justify-center">
            <MarkdownContent
              text={front}
              className="line-clamp-2 text-xs text-muted-foreground"
            />
          </div>
          <div className="flex flex-1 items-center justify-center text-center">
            <MarkdownContent
              text={back}
              className="text-base leading-relaxed sm:text-lg"
            />
          </div>
          <div className="flex min-h-6 items-center justify-center">
            <span className="text-xs text-muted-foreground">
              Rate your recall below
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
