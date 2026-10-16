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
  const navId = "admin-global-navigation"

  const closeNav = React.useCallback(() => setIsNavOpen(false), [])

  React.useEffect(() => {
    closeNav()
  }, [pathname, closeNav])

  React.useEffect(() => {
    if (!isNavOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNav()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isNavOpen, closeNav])

  return (
    <AuthGuard>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-[#EEF4F8] font-sans text-[12px] text-[#1F3A5C] antialiased">
        {!isWorkspace && <AdminSidebar mode="persistent" />}

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
                : "min-h-0 flex-1 w-full max-w-7xl mx-auto overflow-y-auto p-4"
            }
          >
            {children}
          </main>
        </div>

        <div className={isWorkspace ? "" : "lg:hidden"}>
          <AdminDrawer open={isNavOpen} onClose={closeNav} title="Admin navigation" side="left">
            <AdminSidebar mode="drawer" onNavigate={closeNav} />
          </AdminDrawer>
        </div>
      </div>
    </AuthGuard>
  )
}
