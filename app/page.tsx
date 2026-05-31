import Image from "next/image";
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

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */
export default function Home() {
  return (
    <main
      className="flex w-full flex-1 flex-col font-sans"
      style={{ backgroundColor: COLORS.white, color: COLORS.textBlack }}
    >
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
          className="relative z-10 flex min-h-[90vh] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14"
          style={{ color: COLORS.white }}
        >
          {/* Top bar */}
          <header className="flex items-start justify-between gap-6">
            <p className="max-w-[15rem] text-[10px] font-medium uppercase leading-[1.7] tracking-[0.22em] sm:text-[11px]">
              AI Training Software
              <br />
              For Restaurants and Small Businesses
            </p>

            <a
              href="#waitlist"
              className="shrink-0 rounded-[2px] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-transparent hover:text-[var(--w)] hover:ring-1 hover:ring-[var(--w)] sm:px-6 sm:py-3"
              style={
                {
                  backgroundColor: COLORS.white,
                  color: COLORS.nearBlack,
                  ["--w" as string]: COLORS.white,
                } as React.CSSProperties
              }
            >
              Join Waitlist
            </a>
          </header>

          {/* Center wordmark */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="select-none pl-[0.3em] text-[19vw] font-semibold leading-none tracking-[0.3em] sm:text-[17vw] lg:text-[14vw]">
              TRAINR
            </h1>
          </div>

          {/* Bottom tagline */}
          <div className="flex justify-center pb-2">
            <p className="max-w-2xl text-center text-[10px] font-medium uppercase leading-[1.8] tracking-[0.28em] text-white/85 sm:text-xs">
              Your AI training layer for faster onboarding and better teams
            </p>
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

            <a
              href="#waitlist"
              className="self-start rounded-[2px] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-85 lg:self-auto"
              style={{ backgroundColor: COLORS.nearBlack, color: COLORS.white }}
            >
              Join Waitlist
            </a>
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
      {/* CASE STUDIES                                                */}
      {/* =========================================================== */}
      <Testimonials />

      {/* =========================================================== */}
      {/* WHAT IT IS — venn                                           */}
      {/* =========================================================== */}
      <section
        id="waitlist"
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
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold tracking-[0.35em]">TRAINR</span>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/45">
            © {new Date().getFullYear()} Trainr — AI training for frontline teams
          </p>
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
