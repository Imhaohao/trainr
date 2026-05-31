"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import TrainrNavbar from "@/components/ui/navigation-menu-4";
import { loadEmployeeSession } from "@/lib/employee/session";
import { demoOwner } from "@/lib/mocks/fixtures";

const EMPLOYEE_LINKS = [
  { href: "/learn", label: "Modules" },
  { href: "/learn/coach", label: "Ask coach" },
];

const OWNER_LINKS = [
  { href: "/onboarding", label: "Intake" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compliance", label: "Compliance" },
  { href: "/deploy", label: "Deploy" },
];

const AUTH_LINKS = [{ href: "/", label: "Home" }];

const MARKETING_LINKS = [
  { href: "/onboarding", label: "Intake" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/join", label: "For employees" },
];

export function MarketingNavbar() {
  return (
    <TrainrNavbar
      links={MARKETING_LINKS}
      logoHref="/"
      logoLabel="Trainr"
      actions={<MarketingNavbarActions />}
    />
  );
}

export function MarketingNavbarActions() {
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Get started</Link>
      </Button>
    </>
  );
}

export function AuthNavbarActions() {
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Owner log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/join">Employee join</Link>
      </Button>
    </>
  );
}

export function EmployeeNavbar() {
  const [userName, setUserName] = useState<string>("Teammate");
  const [initial, setInitial] = useState("T");

  useEffect(() => {
    const session = loadEmployeeSession();
    if (!session) return;
    const name = session.user.name ?? "Teammate";
    setUserName(name);
    setInitial(name.charAt(0).toUpperCase());
  }, []);

  return (
    <TrainrNavbar
      links={EMPLOYEE_LINKS}
      logoHref="/learn"
      logoLabel="Trainr"
      showInfoMenu
      showUserMenu
      userInitial={initial}
      userName={userName}
    />
  );
}

export function OwnerNavbar({ leading }: { leading?: React.ReactNode }) {
  return (
    <TrainrNavbar
      links={OWNER_LINKS}
      logoHref="/dashboard"
      logoLabel="Trainr"
      leading={leading}
      showInfoMenu
      showNotifications
      showUserMenu
      userInitial={demoOwner.name.charAt(0)}
      userName={demoOwner.name}
    />
  );
}

export function AuthNavbar() {
  return (
    <TrainrNavbar
      links={AUTH_LINKS}
      logoHref="/"
      logoLabel="Trainr.ai"
      actions={<AuthNavbarActions />}
    />
  );
}
