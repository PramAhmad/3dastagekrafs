"use client"

import { useRef, type ComponentType, type KeyboardEvent } from "react"

export interface WorkspaceTabItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  shortLabel?: string
}

interface WorkspaceTabsProps {
  items: WorkspaceTabItem[]
  activeId: string
  onChange: (id: string) => void
  tablistLabel: string
  panelIdPrefix: string
  className?: string
}

export default function WorkspaceTabs({
  items,
  activeId,
  onChange,
  tablistLabel,
  panelIdPrefix,
  className = "",
}: WorkspaceTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectAt = (index: number) => {
    const next = items[index]
    if (!next) return
    onChange(next.id)
    requestAnimationFrame(() => tabRefs.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest" }))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(key)) return
    event.preventDefault()

    if (key === "Home") {
      selectAt(0)
      tabRefs.current[0]?.focus()
      return
    }
    if (key === "End") {
      const lastIndex = items.length - 1
      selectAt(lastIndex)
      tabRefs.current[lastIndex]?.focus()
      return
    }

    const direction = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1
    const nextIndex = (index + direction + items.length) % items.length
    selectAt(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={tablistLabel}
      className={`flex min-w-0 gap-1 overflow-x-auto border-b border-[#D5E4F0] bg-white px-3 py-2 scrollbar-thin ${className}`}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        const selected = item.id === activeId
        const tabId = `${panelIdPrefix}-tab-${item.id}`
        const panelId = `${panelIdPrefix}-panel-${item.id}`

        return (
          <button
            key={item.id}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            title={item.label}
            onClick={() => selectAt(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex min-h-11 min-w-[5.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2F79A6] motion-reduce:transition-none sm:flex-1 sm:text-xs ${
              selected ? "border-[#1F3A5C] bg-[#1F3A5C] text-white shadow-sm" : "border-transparent bg-[#F6F9FB] text-[#4B6B94] hover:border-[#D5E4F0] hover:bg-white hover:text-[#1F3A5C]"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${selected ? "text-[#F7CB45]" : "text-[#2F79A6]"}`} aria-hidden="true" />
            <span className="truncate sm:hidden">{item.shortLabel ?? item.label}</span>
            <span className="hidden truncate sm:inline">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export type { WorkspaceTabsProps }
