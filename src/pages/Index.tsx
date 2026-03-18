import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Brain, Zap, ArrowRight, BarChart3, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { ScrollReveal } from "@/components/animations";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";

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

const stats = [
  { value: "35%", label: "Average space wasted" },
  { value: "2.4x", label: "Faster room booking" },
  { value: "89%", label: "User satisfaction" },
];

const Index = () => {
  return (
    <PageTransition>
      <PublicNav />

      {/* Hero */}
      <section className="gradient-hero min-h-screen flex items-center relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(hsl(172, 66%, 45%) 1px, transparent 1px), linear-gradient(90deg, hsl(172, 66%, 45%) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="container relative z-10 pt-24 pb-20">
          <StaggerContainer className="max-w-3xl">
            <StaggerItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Smart Workplace Platform
              </span>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground leading-[1.1] mb-6">
                Know what's booked
                <br />
                <span className="text-gradient">vs what's used.</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-lg sm:text-xl text-primary-foreground/70 max-w-xl mb-10 leading-relaxed">
                SpaceFlow gives SMBs and coworking operators real-time visibility into space utilization — so you stop guessing and start optimizing.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gradient-primary text-primary-foreground font-semibold text-base px-8 shadow-lg hover:scale-[1.03] transition-transform duration-200">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10 font-medium text-base px-8">
                    See Features
                  </Button>
                </a>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-primary font-display">{stat.value}</div>
                <div className="text-sm text-primary-foreground/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
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
