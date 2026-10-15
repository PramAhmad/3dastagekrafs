"use client"

import React from "react"
import { usePathname } from "next/navigation"
import AuthGuard from "@/components/admin/AuthGuard"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isStudio = pathname.includes("/admin/studio")

  return (
    <AuthGuard>
      <div className="h-screen bg-[#EEF4F8] text-[#1F3A5C] flex font-sans antialiased text-[12px] overflow-hidden">
        {/* Left Fixed Sidebar */}
        <AdminSidebar />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <AdminHeader />
          <main
            className={
              isStudio
                ? "flex-1 w-full h-[calc(100vh-56px)] overflow-hidden"
                : "flex-1 p-6 max-w-7xl w-full mx-auto overflow-y-auto"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
