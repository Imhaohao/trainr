import Image from "next/image";

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/* Brand palette (matches landing page) */
const COLORS = {
  background: "#f7f7f2",
  border: "#e8e8e2",
  titleText: "#111111",
  cardTitle: "#111111",
  description: "rgba(17,17,17,0.55)",
} as const;

interface CaseStudy {
  image: { path: string; alt: string };
  title: string;
  description: string;
  href: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    image: {
      path: "/images/boba-employee-hero.png",
      alt: "Boba shop barista smiling at the counter",
    },
    title: "Happy Lemon onboards a new barista in a single shift",
    description:
      "Scattered opening, closing, and drink notes became one repeatable training flow new hires finish on day one.",
    href: "#waitlist",
  },
  {
    image: {
      path: "/images/boba-counter.png",
      alt: "Team member at a tidy drink-prep counter",
    },
    title: "Standardizing drink SOPs across every location",
    description:
      "Each store now teaches the same recipes, prep steps, and quality checks — no more location-by-location drift.",
    href: "#waitlist",
  },
  {
    image: {
      path: "/images/boba-team-1.png",
      alt: "Employee in front of the menu wall",
    },
    title: "From a folder of notes to structured onboarding",
    description:
      "Owners drop in what they already have and Trainr turns it into lessons, checklists, and quizzes automatically.",
    href: "#waitlist",
  },
  {
    image: {
      path: "/images/boba-team-2.png",
      alt: "Shift lead by the boba mascot display",
    },
    title: "Shift leads practice with AI roleplay before the rush",
    description:
      "Staff rehearse real customer questions and edge cases, so the floor stays calm when it gets busy.",
    href: "#waitlist",
  },
];

export default function Testimonials() {
  return (
    <section
      className="relative w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-14"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Head */}
        <div
          className="border-b pb-12"
          style={{ borderColor: COLORS.border }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
            Case Studies
          </p>
          <h2
            className="mt-5 max-w-3xl text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.6rem]"
            style={{ color: COLORS.titleText }}
          >
            Built for the teams that keep frontline service consistent
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 pt-14 sm:grid-cols-2">
          {CASE_STUDIES.map((study, index) => (
            <article key={index} className="flex flex-col gap-7 lg:flex-row">
              {/* Image */}
              <a
                href={study.href}
                className="block aspect-[1.9] w-full overflow-hidden rounded-[2px] lg:w-1/2"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[2px]">
                  <Image
                    src={study.image.path}
                    alt={study.image.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover object-[center_30%] transition-transform duration-500 ease-out hover:scale-105"
                  />
                </div>
              </a>

              {/* Content */}
              <div className="flex w-full flex-1 flex-col lg:w-1/2">
                <a
                  href={study.href}
                  className="text-xl font-medium leading-snug tracking-tight transition-opacity duration-150 hover:opacity-70"
                  style={{ color: COLORS.cardTitle }}
                >
                  {study.title}
                </a>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: COLORS.description }}
                >
                  {study.description}
                </p>
                <div className="mt-5">
                  <a
                    href={study.href}
                    className="group inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-150 hover:opacity-70"
                    style={{ color: COLORS.cardTitle }}
                  >
                    Learn more
                    <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
