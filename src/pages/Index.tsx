import { Link } from "react-router-dom";
import {
  Eye, Brain, Zap, ArrowRight, BarChart3, Calendar, Users, Quote,
  Ghost, TrendingUp, MessageSquare, BellRing, LayoutGrid,
  CheckCircle2, XCircle, Minus, Sparkles, ShieldCheck,
  RefreshCcw, AlertTriangle, Clock4, Repeat2, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { ScrollReveal } from "@/components/animations";
import { PageTransition } from "@/components/animations";
import { ShuffleCards } from "@/components/ui/testimonial-cards";
import GlassmorphismHero from "@/components/ui/glassmorphism-hero";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import MockDashboard from "@/components/ui/mock-dashboard";
import { CountUp } from "@/components/SkeletonLoaders";

/* ── AI feature cards ─────────────────────────────────────────────── */
const AI_FEATURES = [
  {
    icon: Ghost,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Ghost Booking Detection",
    description:
      "No check-in within 10 minutes of start time? SpaceFlow auto-cancels the booking, frees the space, and notifies waiting teams — silently recovering up to 35% of lost capacity.",
    badge: "Saves ~35% capacity",
  },
  {
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Demand Forecasting",
    description:
      "ML models trained on your booking history predict tomorrow's occupancy peaks before they happen — so you can pre-allocate overflow rooms 24 hours in advance.",
    badge: "24-hr ahead alerts",
  },
  {
    icon: LayoutGrid,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    title: "Smart Layout Suggestions",
    description:
      "When a floor consistently runs below 30% occupancy, AI flags it, calculates consolidation ROI, and drafts a reconfiguration plan — without you opening a spreadsheet.",
    badge: "Auto ROI calculation",
  },
  {
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Natural Language Booking",
    description:
      '"Book me a quiet room for 2 people this afternoon" — the AI chat finds the best match, checks real-time availability, and confirms in seconds.',
    badge: "Conversational UI",
  },
  {
    icon: BellRing,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    title: "No-Show Intelligence",
    description:
      "SpaceFlow learns which teams consistently over-book. It sends calibrated nudges — not generic reminders — timed to each team's behaviour pattern.",
    badge: "Per-team learning",
  },
  {
    icon: RefreshCcw,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Automated Space Release",
    description:
      "Freed spaces are immediately surfaced to colleagues on the waitlist via real-time push notifications — zero manual coordination, zero wasted minutes.",
    badge: "Real-time release",
  },
];

/* ── Comparison data ──────────────────────────────────────────────── */
const COMPARE_FEATURES = [
  "Real-time occupancy",
  "Ghost booking detection",
  "AI recommendations",
  "Demand forecasting",
  "Works without sensors",
  "Setup in <5 minutes",
  "SMB-friendly pricing",
  "Analytics dashboard",
  "Hybrid work support",
  "No IT team required",
];
// true = yes, false = no, null = partial
const COMPARE_DATA: Record<string, (boolean | null)[]> = {
  "Spreadsheets":    [false, false, false, false, true,  false, true,  false, false, true ],
  "Generic IWMS":    [null,  false, false, false, false, false, false, null,  null,  false],
  "SpaceFlow":       [true,  true,  true,  true,  true,  true,  true,  true,  true,  true ],
};

/* ── Edge case scenarios ──────────────────────────────────────────── */
const EDGE_CASES = [
  {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    scenario: "Meeting booked, no one shows up",
    solution: "Detected in 10 min. Space auto-freed. Admin notified. Next person on waitlist gets the room.",
  },
  {
    icon: Repeat2,
    color: "text-primary",
    bg: "bg-primary/8",
    scenario: "Recurring weekly team sync",
    solution: "Pattern learned after 2 occurrences. SpaceFlow suggests auto-confirm with smart conflict detection.",
  },
  {
    icon: Building2,
    color: "text-indigo-400",
    bg: "bg-indigo-400/8",
    scenario: "Entire floor underperforms",
    solution: "AI flags 23% avg occupancy, calculates consolidation savings, and proposes a layout in one click.",
  },
  {
    icon: Clock4,
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    scenario: "Last-minute room change needed",
    solution: "Real-time availability grid. One-tap rebooking with conflict check. Takes under 15 seconds.",
  },
  {
    icon: Users,
    color: "text-sky-400",
    bg: "bg-sky-400/8",
    scenario: "Hybrid team, mixed attendance",
    solution: "Demand forecast adjusts for remote days. Hot desk inventory auto-scales with office headcount.",
  },
  {
    icon: ShieldCheck,
    color: "text-rose-400",
    bg: "bg-rose-400/8",
    scenario: "Compliance & audit trail",
    solution: "Every booking, cancellation, and check-in is logged with timestamps and user attribution — always audit-ready.",
  },
];

/* ── Value pillars ─────────────────────────────────────────────────── */
const pillars = [
  {
    icon: Eye,
    title: "Visibility",
    description: "Real-time dashboards showing exactly what's booked, what's used, and what's sitting empty — no guesswork.",
  },
  {
    icon: Brain,
    title: "Intelligence",
    description: "AI-powered recommendations to optimize layouts, reduce ghost bookings, and surface savings you didn't know existed.",
  },
  {
    icon: Zap,
    title: "Simplicity",
    description: "One-click booking, instant confirmations, and zero-sensor setup. Live in under 5 minutes, loved by everyone.",
  },
];

/* ── Helpers ───────────────────────────────────────────────────────── */
function CompareCell({ value }: { value: boolean | null }) {
  if (value === true)  return <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />;
  if (value === false) return <XCircle      className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <Minus className="w-4 h-4 text-amber-400/70 mx-auto" title="Partial" />;
}

/* ── Page ──────────────────────────────────────────────────────────── */
const Index = () => {
  return (
    <PageTransition>
      <PublicNav />

      {/* ── Hero ── */}
      <GlassmorphismHero />

      {/* ── Product Preview — Mock Dashboard ── */}
      <section className="overflow-hidden bg-background">
        <ContainerScroll
          titleComponent={
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                Live Dashboard
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
                Your workplace,{" "}
                <br />
                <span className="text-primary">fully in view</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
                See every desk, room, and zone — booked, occupied, or available — in one real-time AI-powered dashboard.
              </p>
            </div>
          }
        >
          <MockDashboard />
        </ContainerScroll>
      </section>

      {/* ── AI Features ── */}
      <section className="py-28 bg-background">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                AI that actually earns its keep
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Not a chatbot slapped on a spreadsheet. Every SpaceFlow AI feature is purpose-built to recover real money from real inefficiency.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.08}>
                <div className="group relative gradient-card rounded-xl border border-border p-7 hover-lift cursor-default overflow-hidden">
                  {/* subtle glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                    style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(172 66% 45% / 0.07) 0%, transparent 70%)" }} />

                  <div className="relative z-10">
                    <div className={`h-11 w-11 rounded-lg ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                      <f.icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-bold font-display">{f.title}</h3>
                      <span className="shrink-0 text-[10px] font-semibold rounded-full border border-primary/20 bg-primary/8 text-primary px-2 py-0.5 whitespace-nowrap">
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SpaceFlow — USP ── */}
      <section className="py-28 bg-muted/40">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                Why SpaceFlow?
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                Not just another booking tool
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Compare SpaceFlow against the alternatives teams actually use before switching.
              </p>
            </div>
          </ScrollReveal>

          {/* Comparison table */}
          <ScrollReveal delay={0.1}>
            <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-2/5">Feature</th>
                    <th className="text-center px-4 py-4 font-medium text-muted-foreground">Spreadsheets</th>
                    <th className="text-center px-4 py-4 font-medium text-muted-foreground">Generic IWMS</th>
                    <th className="text-center px-4 py-4 font-bold text-primary">
                      <div className="flex flex-col items-center gap-1">
                        <span>SpaceFlow</span>
                        <span className="text-[10px] font-semibold rounded-full bg-primary/15 text-primary px-2 py-0.5">Recommended</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_FEATURES.map((feature, i) => (
                    <tr
                      key={feature}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    >
                      <td className="px-6 py-3.5 font-medium text-foreground">{feature}</td>
                      {(["Spreadsheets", "Generic IWMS", "SpaceFlow"] as const).map((col) => (
                        <td key={col} className={`text-center px-4 py-3.5 ${col === "SpaceFlow" ? "bg-primary/5" : ""}`}>
                          <CompareCell value={COMPARE_DATA[col][i]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              <Minus className="w-3 h-3 inline-block text-amber-400 mr-1" />
              = Partial support &nbsp;·&nbsp; IWMS = Integrated Workplace Management System
            </p>
          </ScrollReveal>

          {/* Edge cases grid */}
          <div className="mt-24">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h3 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mb-3">
                  Every edge case, handled
                </h3>
                <p className="text-muted-foreground text-base max-w-xl mx-auto">
                  Real-world workspace chaos that SpaceFlow turns into a non-event.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {EDGE_CASES.map((ec, i) => (
                <ScrollReveal key={ec.scenario} delay={i * 0.07}>
                  <div className={`rounded-xl border border-border p-6 hover-lift cursor-default ${ec.bg}`}>
                    <div className={`flex items-center gap-2.5 mb-4`}>
                      <ec.icon className={`w-4.5 h-4.5 ${ec.color}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${ec.color}`}>Scenario</span>
                    </div>
                    <p className="font-semibold text-foreground mb-3 leading-snug">"{ec.scenario}"</p>
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border/60">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{ec.solution}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Value Pillars ── */}
      <section id="features" className="py-24 scroll-mt-20">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                Everything you need to run smarter spaces
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three pillars that transform how you think about your workplace.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, i) => (
              <ScrollReveal key={pillar.title} delay={i * 0.1}>
                <div className="group gradient-card rounded-xl border border-border p-8 hover-lift cursor-default">
                  <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                    <pillar.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-muted/50 scroll-mt-20">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                How SpaceFlow works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                From booking to insights in three simple steps.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Calendar,  step: "01", title: "Book",     desc: "Team members book desks, rooms, or zones with one click — or just ask the AI in plain English." },
              { icon: BarChart3, step: "02", title: "Track",    desc: "SpaceFlow captures real-time utilization data automatically — no sensors, no configuration." },
              { icon: Users,     step: "03", title: "Optimize", desc: "Get AI recommendations to reduce ghost bookings, consolidate underused floors, and maximise ROI." },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.1}>
                <div className="text-center">
                  <span className="text-5xl font-bold font-display text-primary/15">{item.step}</span>
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mt-2 mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 overflow-hidden">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Quote className="h-3.5 w-3.5" />
                What customers say
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                Real results from real teams
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Drag the card to see more — or let them speak for themselves.
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <ScrollReveal>
              <div className="relative h-[420px] w-[560px] flex items-center justify-start pl-4">
                <ShuffleCards />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="flex flex-col gap-8 max-w-xs">
                {[
                  { target: 28, suffix: "%",      label: "Average no-show reduction",  sub: "in the first 30 days" },
                  { target: 3.1,suffix: "×",      label: "More actionable insight",    sub: "vs spreadsheets", decimals: 1 },
                  { value: "< 5 min",             label: "Setup time",                 sub: "no sensors required" },
                ].map((s) => (
                  <div key={s.label} className="flex items-start gap-4">
                    <div className="h-1 w-8 rounded-full bg-primary mt-3 shrink-0" />
                    <div>
                      <div className="text-3xl font-bold font-display text-primary">
                        {"target" in s
                          ? <CountUp target={s.target} suffix={s.suffix} decimals={s.decimals ?? 0} duration={1600} />
                          : s.value}
                      </div>
                      <div className="text-sm font-medium mt-0.5">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="container">
          <ScrollReveal>
            <div className="rounded-2xl gradient-hero p-12 sm:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle, hsl(172, 66%, 45%) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 mb-6">
                  No credit card · Live in &lt;5 minutes · Cancel anytime
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-primary-foreground mb-4">
                  Ready to stop guessing about your space?
                </h2>
                <p className="text-primary-foreground/70 text-lg mb-8 max-w-lg mx-auto">
                  Join hundreds of teams that recovered thousands in wasted bookings — without installing a single sensor.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button size="lg" className="gradient-primary text-primary-foreground font-semibold text-base px-8 shadow-lg hover:scale-[1.03] transition-transform duration-200">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline" className="font-semibold text-base px-8 border-white/20 text-white hover:bg-white/10">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg">
            Space<span className="text-primary">Flow</span>
          </span>
          <p className="text-sm text-muted-foreground">© 2026 SpaceFlow. All rights reserved.</p>
        </div>
      </footer>
    </PageTransition>
  );
};

export default Index;
