import Image from "next/image";
import Link from "next/link";
import { MarketingNavbar } from "@/components/layout/AppNavbars";
import Testimonials from "@/components/landing/testimonials";

/* ------------------------------------------------------------------ */
/* Brand palette (from spec)                                          */
/* ------------------------------------------------------------------ */
const COLORS = {
  nearBlack: "#050706",
  deepGreen: "#0b2520",
  mutedTeal: "#163b34",
  white: "#f7f7f2",
  lightGray: "#e8e8e2",
  textBlack: "#111111",
} as const;

/* ------------------------------------------------------------------ */
/* Minimal line icons (stroke 1.5, geometric)                          */
/* ------------------------------------------------------------------ */
type IconProps = { className?: string };

const iconBase = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconLayers({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <path d="M24 8 8 17l16 9 16-9-16-9Z" />
      <path d="M8 24l16 9 16-9" />
      <path d="M8 31l16 9 16-9" />
    </svg>
  );
}

function IconGrid({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <path d="M24 7 41 38H7L24 7Z" />
      <path d="M24 7v31" />
      <path d="M15.5 23h17" />
    </svg>
  );
}

function IconCone({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <circle cx="24" cy="14" r="6" />
      <path d="M24 20 13 40h22L24 20Z" />
    </svg>
  );
}

function IconOrbit({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="6" />
      <ellipse cx="24" cy="24" rx="17" ry="9" />
      <circle cx="41" cy="24" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconArrows({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <path d="M10 30 24 12l14 18" />
      <path d="M10 38 24 20l14 18" />
    </svg>
  );
}

function IconCircle({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Benefit cards                                                       */
/* ------------------------------------------------------------------ */
const BENEFITS = [
  {
    no: "01",
    title: "Onboard new hires faster",
    desc: "Turn scattered instructions into clear, repeatable training flows.",
    Icon: IconLayers,
  },
  {
    no: "02",
    title: "Standardize every role",
    desc: "Create consistent SOPs for cashiers, cooks, baristas, shift leads, and managers.",
    Icon: IconGrid,
  },
  {
    no: "03",
    title: "Train with real scenarios",
    desc: "Use AI roleplay to practice customer questions, mistakes, and edge cases.",
    Icon: IconCone,
  },
  {
    no: "04",
    title: "Track employee progress",
    desc: "See who completed training, passed quizzes, and needs extra support.",
    Icon: IconOrbit,
  },
  {
    no: "05",
    title: "Create content instantly",
    desc: "Generate lessons, quizzes, checklists, and scripts from your existing notes.",
    Icon: IconArrows,
  },
  {
    no: "06",
    title: "Keep standards consistent",
    desc: "Make sure every location teaches the same expectations.",
    Icon: IconCircle,
  },
];

/* ------------------------------------------------------------------ */
/* App entry points (owner + employee workflows)                       */
/* ------------------------------------------------------------------ */
const WORKFLOWS = [
  {
    step: "01",
    title: "Training context",
    desc: "Capture roles, recipes, operations, and uploads — Trainr structures your business knowledge.",
    href: "/onboarding",
    cta: "Start intake",
  },
  {
    step: "02",
    title: "Training creation",
    desc: "Generate modules and quizzes from your intake, then review and edit the program.",
    href: "/dashboard",
    cta: "Open program builder",
  },
  {
    step: "03",
    title: "Business dashboard",
    desc: "Share join codes, track progress, run compliance checks, and publish to your team.",
    href: "/dashboard",
    cta: "Go to dashboard",
  },
] as const;

const FOOTER_LINKS = [
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Owner login" },
  { href: "/onboarding", label: "Intake wizard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compliance", label: "Compliance" },
  { href: "/deploy", label: "Deploy" },
  { href: "/join", label: "Employee join" },
] as const;

const SIGN_IN_PATHS = [
  {
    audience: "Small business owner",
    headline: "Build and run your training program",
    desc: "Sign up, capture your business context, generate modules, and publish to your team from one owner workspace.",
    bullets: [
      "Email and password login",
      "Intake wizard, dashboard, compliance, deploy",
      "Share join codes with new hires",
    ],
    primary: { href: "/signup", label: "Create owner account" },
    secondary: { href: "/login", label: "Owner log in" },
  },
  {
    audience: "Employee",
    headline: "Join your team’s training",
    desc: "Enter the join code from your manager — no password required. Pick up modules, quizzes, and your AI coach from there.",
    bullets: [
      "Join code + your name only",
      "Works on phone between shifts",
      "Demo code for Happy Lemon: HLEMON",
    ],
    primary: { href: "/join", label: "Join with code" },
    secondary: null,
  },
] as const;

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */
export default function Home() {
  return (
    <main
      className="flex w-full flex-1 flex-col font-sans"
      style={{ backgroundColor: COLORS.white, color: COLORS.textBlack }}
    >
      <MarketingNavbar />

      {/* =========================================================== */}
      {/* HERO                                                        */}
      {/* =========================================================== */}
      <section className="relative flex min-h-[90vh] w-full flex-col overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/boba-employee-hero.png"
          alt="Smiling boba shop team member at the drink counter"
          fill
          priority
          sizes="100vw"
          className="scale-[1.2] object-cover object-[center_25%]"
        />

        {/* Gradient + tint overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(5,7,6,0.72) 0%, rgba(11,37,32,0.45) 38%, rgba(11,37,32,0.55) 70%, rgba(5,7,6,0.85) 100%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(11,37,32,0.28)" }}
        />

        {/* Foreground content */}
        <div
          className="relative z-10 flex min-h-[85vh] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14"
          style={{ color: COLORS.white }}
        >
          <p className="max-w-[15rem] text-[10px] font-medium uppercase leading-[1.7] tracking-[0.22em] text-white/80 sm:text-[11px]">
            AI Training Software
            <br />
            For Restaurants and Small Businesses
          </p>

          {/* Center wordmark */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="select-none pl-[0.3em] text-[19vw] font-semibold leading-none tracking-[0.3em] sm:text-[17vw] lg:text-[14vw]">
              TRAINR
            </h1>
          </div>

          {/* Bottom tagline + entry */}
          <div className="flex flex-col items-center gap-6 pb-2">
            <p className="max-w-2xl text-center text-[10px] font-medium uppercase leading-[1.8] tracking-[0.28em] text-white/85 sm:text-xs">
              Your AI training layer for faster onboarding and better teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/onboarding"
                className="rounded-[2px] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ring-white/35 transition-colors hover:bg-white/10"
              >
                Set up training context
              </Link>
              <Link
                href="/dashboard"
                className="rounded-[2px] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-85"
                style={{ backgroundColor: COLORS.white, color: COLORS.nearBlack }}
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* SIGN IN — owner vs employee                                 */}
      {/* =========================================================== */}
      <section
        id="sign-in"
        className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-14"
        style={{ backgroundColor: COLORS.mutedTeal, color: COLORS.white }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
              Sign in
            </p>
            <h2 className="mt-5 text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              Two ways into Trainr
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
              Owners manage programs and compliance. Employees join with a code
              from their manager and start training right away.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {SIGN_IN_PATHS.map((path) => (
              <article
                key={path.audience}
                className="flex flex-col justify-between gap-8 rounded-[2px] border p-8 sm:p-10"
                style={{
                  borderColor: "rgba(247,247,242,0.18)",
                  backgroundColor: "rgba(5,7,6,0.2)",
                }}
              >
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                    {path.audience}
                  </p>
                  <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
                    {path.headline}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {path.desc}
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-white/55">
                    {path.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="text-white/35" aria-hidden="true">
                          —
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={path.primary.href}
                    className="rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: COLORS.white,
                      color: COLORS.deepGreen,
                    }}
                  >
                    {path.primary.label}
                  </Link>
                  {path.secondary ? (
                    <Link
                      href={path.secondary.href}
                      className="rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] ring-1 ring-white/30 transition-colors hover:bg-white/10"
                    >
                      {path.secondary.label}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* FOR WHO — benefits                                          */}
      {/* =========================================================== */}
      <section
        className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-14"
        style={{ backgroundColor: COLORS.white, color: COLORS.textBlack }}
      >
        <div className="mx-auto w-full max-w-6xl">
          {/* Section head */}
          <div className="flex flex-col gap-8 border-b pb-12 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: COLORS.lightGray }}>
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                For Who
              </p>
              <h2 className="mt-5 text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.9rem]">
                For teams that need training to actually stick
              </h2>
            </div>

            <Link
              href="/signup"
              className="self-start rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-85 lg:self-auto"
              style={{ backgroundColor: COLORS.nearBlack, color: COLORS.white }}
            >
              Get started free
            </Link>
          </div>

          {/* 2x3 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ no, title, desc, Icon }) => (
              <article
                key={no}
                className="group flex flex-col gap-7 border-b border-r-0 p-8 sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0 sm:py-10 lg:p-10"
                style={{ borderColor: COLORS.lightGray }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-9 text-black/80" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-black/35">
                    {no}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-medium tracking-tight">{title}</h3>
                  <p className="text-sm leading-relaxed text-black/55">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* PRODUCT WORKFLOWS                                           */}
      {/* =========================================================== */}
      <section
        id="workflows"
        className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-14"
        style={{ backgroundColor: COLORS.deepGreen, color: COLORS.white }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
              How it works
            </p>
            <h2 className="mt-5 text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              From business context to trained teams
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
              Owners capture operational knowledge, generate a training program,
              and manage rollout from one workspace. Employees join with a code.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {WORKFLOWS.map((flow) => (
              <Link
                key={flow.step}
                href={flow.href}
                className="group flex flex-col justify-between gap-8 rounded-[2px] border p-8 transition-colors hover:bg-white/5 sm:p-10"
                style={{ borderColor: "rgba(247,247,242,0.18)" }}
              >
                <div className="flex flex-col gap-4">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40">
                    {flow.step}
                  </span>
                  <h3 className="text-xl font-medium tracking-tight">
                    {flow.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {flow.desc}
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 transition-colors group-hover:text-white">
                  {flow.cta} →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ backgroundColor: COLORS.white, color: COLORS.deepGreen }}
            >
              Create owner account
            </Link>
            <Link
              href="/join"
              className="rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] ring-1 ring-white/30 transition-colors hover:bg-white/10"
            >
              Join as employee
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* CASE STUDIES                                                */}
      {/* =========================================================== */}
      <Testimonials />

      {/* =========================================================== */}
      {/* WHAT IT IS — venn                                           */}
      {/* =========================================================== */}
      <section
        className="w-full px-6 py-24 sm:px-10 sm:py-32 lg:px-14"
        style={{ backgroundColor: COLORS.deepGreen, color: COLORS.white }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
            What It Is
          </p>
          <h2 className="mt-6 max-w-3xl text-3xl font-medium leading-[1.18] tracking-tight sm:text-4xl lg:text-[2.9rem]">
            AI-generated training tools
            <br className="hidden sm:block" /> for faster, more consistent teams
          </h2>

          {/* Venn visual */}
          <VennDiagram />
        </div>
      </section>

      {/* =========================================================== */}
      {/* FOOTER                                                      */}
      {/* =========================================================== */}
      <footer
        className="w-full border-t px-6 py-10 sm:px-10 lg:px-14"
        style={{ backgroundColor: COLORS.nearBlack, color: COLORS.white, borderColor: "rgba(247,247,242,0.1)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:justify-start"
            aria-label="App navigation"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href="/"
              className="text-sm font-semibold tracking-[0.35em] transition-opacity hover:opacity-80"
            >
              TRAINR
            </Link>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/45">
              © {new Date().getFullYear()} Trainr — AI training for frontline teams
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Venn diagram visual                                                 */
/* ------------------------------------------------------------------ */
function VennDiagram() {
  return (
    <div className="mt-16 w-full sm:mt-20">
      {/* Desktop / tablet: overlapping circles */}
      <div className="relative mx-auto hidden h-[360px] w-full max-w-3xl sm:block">
        {/* Left circle */}
        <div
          className="absolute left-[8%] top-1/2 flex size-[300px] -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center"
          style={{ borderColor: "rgba(247,247,242,0.35)", backgroundColor: "rgba(22,59,52,0.45)" }}
        >
          <div className="pr-[35%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
              Training Builder
            </p>
            <p className="mt-2 max-w-[8rem] text-[11px] leading-relaxed text-white/60">
              SOPs, lessons, quizzes, checklists
            </p>
          </div>
        </div>

        {/* Right circle */}
        <div
          className="absolute right-[8%] top-1/2 flex size-[300px] -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center"
          style={{ borderColor: "rgba(247,247,242,0.35)", backgroundColor: "rgba(22,59,52,0.45)" }}
        >
          <div className="pl-[35%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
              Team Intelligence
            </p>
            <p className="mt-2 max-w-[8rem] text-[11px] leading-relaxed text-white/60">
              Progress tracking, roleplay, feedback
            </p>
          </div>
        </div>

        {/* Center white circle */}
        <div
          className="absolute left-1/2 top-1/2 z-10 flex size-[170px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center"
          style={{ backgroundColor: COLORS.white, color: COLORS.deepGreen }}
        >
          <p className="text-sm font-semibold tracking-[0.18em]">Trainr</p>
          <p className="mt-1.5 max-w-[7.5rem] text-[10px] leading-snug text-black/55">
            A faster way to train frontline teams
          </p>
        </div>
      </div>

      {/* Mobile: stacked rings */}
      <div className="flex flex-col items-center gap-5 sm:hidden">
        {[
          {
            label: "Training Builder",
            sub: "SOPs, lessons, quizzes, checklists",
            solid: false,
          },
          {
            label: "Trainr",
            sub: "A faster way to train frontline teams",
            solid: true,
          },
          {
            label: "Team Intelligence",
            sub: "Progress tracking, roleplay, feedback",
            solid: false,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="flex size-56 flex-col items-center justify-center rounded-full border text-center"
            style={
              c.solid
                ? { backgroundColor: COLORS.white, color: COLORS.deepGreen, borderColor: COLORS.white }
                : { borderColor: "rgba(247,247,242,0.35)", backgroundColor: "rgba(22,59,52,0.45)" }
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              {c.label}
            </p>
            <p
              className="mt-2 max-w-[9rem] text-[11px] leading-relaxed"
              style={{ color: c.solid ? "rgba(0,0,0,0.55)" : "rgba(247,247,242,0.6)" }}
            >
              {c.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
