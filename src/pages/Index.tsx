import { Link } from "react-router-dom";
import { Eye, Brain, Zap, ArrowRight, BarChart3, Calendar, Users, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { ScrollReveal } from "@/components/animations";
import { PageTransition } from "@/components/animations";
import { ShuffleCards } from "@/components/ui/testimonial-cards";
import GlassmorphismHero from "@/components/ui/glassmorphism-hero";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const pillars = [
  {
    icon: Eye,
    title: "Visibility",
    description: "Real-time dashboards showing exactly what's booked, what's used, and what's sitting empty.",
  },
  {
    icon: Brain,
    title: "Intelligence",
    description: "AI-powered recommendations to optimize layouts, pricing, and space allocation.",
  },
  {
    icon: Zap,
    title: "Simplicity",
    description: "One-click booking, instant confirmations, and zero friction for your team.",
  },
];

const Index = () => {
  return (
    <PageTransition>
      <PublicNav />

      {/* Hero */}
      <GlassmorphismHero />

      {/* Product Preview — Scroll Animation */}
      <section className="overflow-hidden bg-background">
        <ContainerScroll
          titleComponent={
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                Live Dashboard
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
                Your workplace, <br />
                <span className="text-primary">fully in view</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
                See every desk, room, and zone — booked, occupied, or available — in one real-time dashboard.
              </p>
            </div>
          }
        >
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80&auto=format&fit=crop"
            alt="SpaceFlow dashboard — modern open-plan office"
            className="mx-auto rounded-2xl object-cover h-full w-full object-top"
            draggable={false}
          />
        </ContainerScroll>
      </section>

      {/* Value Pillars */}
      <section id="features" className="py-24 scroll-mt-20">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                Everything you need to manage space
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

      {/* How it works */}
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
              { icon: Calendar, step: "01", title: "Book", desc: "Team members book desks, rooms, or zones with one click." },
              { icon: BarChart3, step: "02", title: "Track", desc: "SpaceFlow captures real-time utilization data automatically." },
              { icon: Users, step: "03", title: "Optimize", desc: "Get AI recommendations to reduce waste and maximize ROI." },
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

      {/* Testimonials */}
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
            {/* Shuffle cards */}
            <ScrollReveal>
              <div className="relative h-[420px] w-[560px] flex items-center justify-start pl-4">
                <ShuffleCards />
              </div>
            </ScrollReveal>

            {/* Side stats */}
            <ScrollReveal delay={0.15}>
              <div className="flex flex-col gap-8 max-w-xs">
                {[
                  { value: "28%", label: "Average no-show reduction", sub: "in the first 30 days" },
                  { value: "3.1×", label: "More actionable insight", sub: "vs spreadsheets" },
                  { value: "< 5 min", label: "Setup time", sub: "no sensors required" },
                ].map((s) => (
                  <div key={s.label} className="flex items-start gap-4">
                    <div className="h-1 w-8 rounded-full bg-primary mt-3 shrink-0" />
                    <div>
                      <div className="text-3xl font-bold font-display text-primary">{s.value}</div>
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

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <ScrollReveal>
            <div className="rounded-2xl gradient-hero p-12 sm:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle, hsl(172, 66%, 45%) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }} />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-primary-foreground mb-4">
                  Ready to see your space clearly?
                </h2>
                <p className="text-primary-foreground/70 text-lg mb-8 max-w-lg mx-auto">
                  Start your free trial today. No credit card required.
                </p>
                <Link to="/signup">
                  <Button size="lg" className="gradient-primary text-primary-foreground font-semibold text-base px-8 shadow-lg hover:scale-[1.03] transition-transform duration-200">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
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
