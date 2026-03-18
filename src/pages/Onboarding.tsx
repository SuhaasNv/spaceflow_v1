import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Building2, CalendarPlus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/animations";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    id: 1,
    icon: Building2,
    title: "Welcome to SpaceFlow",
    subtitle: "Smart workspace management",
    description: "SpaceFlow helps you see what's booked vs what's actually used — and gives you AI-powered recommendations to optimize your workspace.",
    cta: "Get started",
  },
  {
    id: 2,
    icon: CalendarPlus,
    title: "Book your first space",
    subtitle: "It takes under 30 seconds",
    description: "Browse available rooms, desks, and collaborative areas. Select a time, confirm, and check in when you arrive. Check-in is available 15 minutes before your booking.",
    cta: "Next",
  },
  {
    id: 3,
    icon: BarChart3,
    title: "See real usage data",
    subtitle: "Ghost bookings are real",
    description: "Most teams have 20-30% of bookings that go unused. SpaceFlow surfaces this automatically and gives you actionable AI recommendations — always advisory, never automatic.",
    cta: "Go to dashboard",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/60" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
              <Icon className="h-10 w-10 text-primary-foreground" />
            </div>

            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">{current.subtitle}</p>
            <h1 className="text-3xl font-bold font-display mb-4">{current.title}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">{current.description}</p>

            {step === 0 && user && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-sm font-medium">
                  Logged in as <strong>{user.name}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  Role: {user.role.replace("_", " ").toLowerCase()}
                </p>
              </div>
            )}

            <Button
              onClick={handleNext}
              className="gradient-primary text-primary-foreground font-semibold px-8 hover:scale-[1.02] transition-transform"
            >
              {current.cta}
              {step < steps.length - 1 ? (
                <ArrowRight className="h-4 w-4 ml-2" />
              ) : (
                <Check className="h-4 w-4 ml-2" />
              )}
            </Button>
          </motion.div>
        </AnimatePresence>

        <p className="text-center mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip onboarding
          </button>
        </p>
      </div>
    </PageTransition>
  );
};

export default Onboarding;
