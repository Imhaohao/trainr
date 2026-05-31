"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { OwnerNavbar } from "@/components/layout/AppNavbars"
import { OwnerSidebar } from "@/components/owner/OwnerSidebar"

export function OwnerAppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <OwnerSidebar />
      <SidebarInset>
        <OwnerNavbar
          leading={
            <SidebarTrigger className="-ml-1 md:hidden" />
          }
        />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
