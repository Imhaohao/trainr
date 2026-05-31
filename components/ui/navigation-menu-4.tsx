"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileText,
  HelpCircle,
  Info,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type NavLinkItem = {
  href: string;
  label: string;
};

export type TrainrNavbarProps = {
  links: NavLinkItem[];
  logoHref?: string;
  logoLabel?: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  showInfoMenu?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  userInitial?: string;
  userName?: string;
  className?: string;
};

const navLinkClass =
  "inline-flex items-center rounded-2xl px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

function MobileMenuTrigger({ links }: { links: NavLinkItem[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="group size-8 md:hidden" variant="ghost" size="icon">
          <svg
            className="pointer-events-none"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 12L20 12"
              className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
            />
            <path
              d="M4 12H20"
              className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
            />
            <path
              d="M4 12H20"
              className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
            />
          </svg>
          <span className="sr-only">Open menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1 md:hidden">
        <NavigationMenu className="max-w-none *:w-full" viewport={false}>
          <NavigationMenuList className="flex-col items-start gap-0">
            {links.map((link) => (
              <NavigationMenuItem key={link.href} className="w-full">
                <NavigationMenuLink asChild>
                  <Link href={link.href} className="w-full py-1.5">
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </PopoverContent>
    </Popover>
  );
}

function InfoMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Info className="size-4" />
          <span className="sr-only">Information</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Help & resources</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/join">
            <HelpCircle className="size-4" />
            Employee help
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding">
            <FileText className="size-4" />
            Owner onboarding
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Users className="size-4" />
            Community
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="size-4" />
          System status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          <Badge
            tone="danger"
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Badge tone="neutral" className="ml-2">
            3 new
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex-col items-start p-3">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-medium">Pipeline ready</span>
            <span className="text-xs text-muted-foreground">2m ago</span>
          </div>
          <span className="mt-1 text-sm text-muted-foreground">
            Happy Lemon&apos;s modules passed compliance review.
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start p-3">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-medium">Deploy reminder</span>
            <span className="text-xs text-muted-foreground">1h ago</span>
          </div>
          <span className="mt-1 text-sm text-muted-foreground">
            Publish the handbook so employees can join with HLEMON.
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start p-3">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-medium">Welcome to Trainr</span>
            <span className="text-xs text-muted-foreground">3h ago</span>
          </div>
          <span className="mt-1 text-sm text-muted-foreground">
            Set up intake, generate modules, then deploy to your team.
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-center">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({
  initial,
  name,
}: {
  initial: string;
  name?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-full">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initial}
          </div>
          <span className="sr-only">Account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{name ?? "My account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">Log out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TrainrNavbar({
  links,
  logoHref = "/",
  logoLabel = "Trainr",
  leading,
  actions,
  showInfoMenu = false,
  showNotifications = false,
  showUserMenu = false,
  userInitial = "U",
  userName,
  className,
}: TrainrNavbarProps) {
  const pathname = usePathname();

  return (
    <header className={cn("sticky top-0 z-50 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <MobileMenuTrigger links={links} />
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href={logoHref}
              className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <Image
                src="/logo.png"
                alt="Trainr logo"
                width={28}
                height={28}
                className="size-7 rounded-lg"
                priority
              />
              <span>{logoLabel}</span>
            </Link>
            <NavigationMenu className="max-md:hidden" viewport={false}>
              <NavigationMenuList className="gap-1">
                {links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" &&
                      pathname.startsWith(`${link.href}/`));
                  return (
                    <NavigationMenuItem key={link.href}>
                      <NavigationMenuLink asChild active={active}>
                        <Link
                          href={link.href}
                          className={cn(
                            navLinkClass,
                            active && "bg-muted/50 text-foreground",
                          )}
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {actions}
          {showInfoMenu && <InfoMenu />}
          {showNotifications && <NotificationMenu />}
          {showUserMenu && (
            <UserMenu initial={userInitial} name={userName} />
          )}
        </div>
      </div>
    </header>
  );
}

export default TrainrNavbar;
