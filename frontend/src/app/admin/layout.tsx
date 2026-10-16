"use client"

import React from "react"
import { usePathname } from "next/navigation"
import AuthGuard from "@/components/admin/AuthGuard"
import AdminDrawer from "@/components/admin/AdminDrawer"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isWorkspace =
    pathname === "/admin/svg-to-model" ||
    pathname.startsWith("/admin/svg-to-model/") ||
    pathname === "/admin/studio" ||
    pathname.startsWith("/admin/studio/")
  const [isNavOpen, setIsNavOpen] = React.useState(false)
  const [isMobileLayout, setIsMobileLayout] = React.useState(false)
  const navId = "admin-global-navigation"

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)")
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)
    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  const closeNav = React.useCallback(() => setIsNavOpen(false), [])
  const isNavVisible = isNavOpen && (isWorkspace || isMobileLayout)

  React.useEffect(() => {
    if (!isNavVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNav()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isNavVisible, closeNav])

  React.useEffect(() => {
    closeNav()
  }, [pathname, closeNav])

  return (
    <AuthGuard>
      <div className="admin-shell flex h-dvh min-h-0 overflow-hidden bg-[#F3F7FA] font-sans text-[12px] text-[#1F3A5C] antialiased">
        {isWorkspace ? (
          !isMobileLayout && <AdminSidebar mode="rail" />
        ) : (
          <AdminSidebar mode="persistent" />
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader
            onMenuClick={() => setIsNavOpen((isOpen) => !isOpen)}
            navOpen={isNavOpen}
            navId={navId}
            isWorkspace={isWorkspace}
          />

          <main
            className={
              isWorkspace
                ? "min-h-0 flex-1 w-full overflow-hidden"
                : "admin-standard min-h-0 flex-1 w-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8"
            }
          >
            {children}
          </main>
        </div>

        <AdminDrawer open={isNavVisible} onClose={closeNav} title="Admin navigation" side="left">
          <AdminSidebar mode="drawer" onNavigate={closeNav} />
        </AdminDrawer>
      </div>
    </AuthGuard>
  )
}
