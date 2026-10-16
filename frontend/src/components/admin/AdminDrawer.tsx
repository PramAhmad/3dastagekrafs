"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

export interface AdminDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  side?: "left" | "right"
  labelledBy?: string
  children: ReactNode
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

function getVisibleFocusableElements(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true") return false
    const style = window.getComputedStyle(element)
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0
  })
}

export default function AdminDrawer({
  open,
  onClose,
  title,
  side = "right",
  labelledBy,
  children,
}: AdminDrawerProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const dialogTitleId = labelledBy ?? titleId

  useEffect(() => {
    if (!open) {
      openerRef.current?.focus()
      openerRef.current = null
      return
    }

    const activeElement = document.activeElement
    openerRef.current = activeElement instanceof HTMLElement ? activeElement : null

    const focusFrame = window.requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return

      ;(closeButtonRef.current ?? getVisibleFocusableElements(panel)[0] ?? panel).focus()
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") return

      const panel = panelRef.current
      if (!panel) return

      const focusableElements = getVisibleFocusableElements(panel)
      if (focusableElements.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (!panel.contains(activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[#1F3A5C]/45 opacity-100 transition-opacity duration-200 motion-reduce:transition-none"
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className={`absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} flex w-[min(90vw,24rem)] min-h-0 flex-col bg-white shadow-2xl outline-none transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#D5E4F0] px-5 py-4">
          <h2 id={titleId} className="min-w-0 truncate text-base font-extrabold text-[#1F3A5C]">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="shrink-0 rounded-lg p-1.5 text-[#627D98] transition-colors hover:bg-[#EEF4F8] hover:text-[#1F3A5C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6] motion-reduce:transition-none"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  )
}
