"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ChevronsUpDown,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  User,
} from "lucide-react"
import {
  InfoCard,
  InfoCardAction,
  InfoCardContent,
  InfoCardDescription,
  InfoCardDismiss,
  InfoCardFooter,
  InfoCardMedia,
  InfoCardTitle,
} from "@/components/ui/info-card"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { demoOwner } from "@/lib/mocks/fixtures"

const NAV_ITEMS = [
  {
    title: "Intake",
    href: "/onboarding",
    icon: ClipboardList,
    description: "Training context",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Program overview",
  },
  {
    title: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    description: "CA labor & safety",
  },
  {
    title: "Deploy",
    href: "/deploy",
    icon: Rocket,
    description: "Publish handbook",
  },
] as const

const SIDEBAR_MEDIA = [
  {
    src: "https://images.unsplash.com/photo-1525385133511-936220a2451a?w=640&q=80",
    alt: "Barista preparing bubble tea",
  },
  {
    src: "https://images.unsplash.com/photo-1554118811-1e0d582224f8?w=640&q=80",
    alt: "Cafe counter and POS",
  },
  {
    src: "https://images.unsplash.com/photo-1495474472287-4d89bcf63f18?w=640&q=80",
    alt: "Team training at a coffee shop",
  },
]

export function OwnerSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                  <BarChart3 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Trainr.ai</span>
                  <span className="text-xs text-muted-foreground">
                    Owner workspace
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <InfoCard storageKey="trainr-owner-dashboard-tip" dismissType="forever">
          <InfoCardContent>
            <InfoCardTitle>Pipeline is ready</InfoCardTitle>
            <InfoCardDescription>
              Happy Lemon&apos;s 8 modules passed compliance. Review edits, then
              publish from Deploy.
            </InfoCardDescription>
            <InfoCardMedia media={SIDEBAR_MEDIA} loading="lazy" />
            <InfoCardFooter>
              <InfoCardDismiss>Dismiss</InfoCardDismiss>
              <InfoCardAction>
                <Link
                  href="/deploy"
                  className="flex flex-row items-center gap-1 underline"
                >
                  Publish now <ExternalLink className="size-3" />
                </Link>
              </InfoCardAction>
            </InfoCardFooter>
          </InfoCardContent>
        </InfoCard>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="justify-between">
              <div className="flex items-center gap-2">
                <User className="size-5" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{demoOwner.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {demoOwner.email}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
