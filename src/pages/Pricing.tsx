import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicNav from "@/components/PublicNav";
import { PageTransition, StaggerContainer, StaggerItem, ScrollReveal } from "@/components/animations";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for small teams getting started.",
    features: [
      "Up to 10 spaces",
      "Up to 25 users",
      "Basic booking & check-in",
      "7-day analytics",
      "Email support",
    ],
    cta: "Get started free",
    ctaLink: "/signup",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing teams that need deeper insights.",
    features: [
      "Unlimited spaces",
      "Unlimited users",
      "Full analytics suite",
      "AI recommendations (Gemini)",
      "Utilization & pattern reports",
      "Booking usage & no-show tracking",
      "Priority support",
    ],
    cta: "Start free trial",
    ctaLink: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations and coworking operators.",
    features: [
      "Everything in Professional",
      "Custom integrations",
      "SSO / SAML",
      "Dedicated onboarding",
      "SLA guarantee",
      "Custom AI focus areas",
    ],
    cta: "Contact sales",
    ctaLink: "mailto:hello@spaceflow.app",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <PageTransition className="min-h-screen bg-background">
      <PublicNav />

      <section className="pt-24 pb-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No hidden fees. No per-sensor charges. Pay for what you need.
          </p>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24">
        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <Card
                className={`relative border h-full ${
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}
                <CardContent className="p-7">
                  <h2 className="text-lg font-bold font-display mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold font-display">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.ctaLink.startsWith("/") ? (
                    <Link to={plan.ctaLink}>
                      <Button
                        className={`w-full font-semibold ${
                          plan.highlighted ? "gradient-primary text-primary-foreground" : ""
                        }`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <a href={plan.ctaLink}>
                      <Button className="w-full" variant="outline">
                        {plan.cta}
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal>
          <div className="mt-16 text-center">
            <p className="text-muted-foreground text-sm">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Questions?{" "}
              <a href="mailto:hello@spaceflow.app" className="text-primary hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </ScrollReveal>
      </section>
    </PageTransition>
  );
};

export default Pricing;
