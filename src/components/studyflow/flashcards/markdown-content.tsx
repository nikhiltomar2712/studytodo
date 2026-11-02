"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { renderMarkdown } from "@/lib/markdown"

/** Renders a flashcard's basic-markdown text as safe HTML. */
export function MarkdownContent({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const html = React.useMemo(() => renderMarkdown(text), [text])
  return (
    <div
      className={cn("sf-md", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
