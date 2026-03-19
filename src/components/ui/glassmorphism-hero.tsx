import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  Building2,
  Layers,
  Globe,
  Cpu,
  BarChart2,
  Wifi,
  Layout,
} from "lucide-react";
import { CountUp } from "@/components/SkeletonLoaders";

const CLIENTS = [
  { name: "Nexus Hub",     icon: Building2 },
  { name: "FlexWork",      icon: Layers    },
  { name: "Orbit Spaces",  icon: Globe     },
  { name: "Basecamp Co.",  icon: Cpu       },
  { name: "TechNest",      icon: BarChart2 },
  { name: "Vertex Labs",   icon: Wifi      },
  { name: "Luminary",      icon: Layout    },
];

export default function GlassmorphismHero() {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-80px" });

  return (
    <div className="relative w-full bg-zinc-950 text-white overflow-hidden font-sans">
      <style>{`
        @keyframes sfFadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sfMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes sfScan {
          0%   { transform: translateX(-100%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(500%); opacity: 0; }
        }
        @keyframes sfGlowPulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%      { opacity: 0.28; transform: scale(1.15); }
        }
        @keyframes sfLiveDot {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0 hsl(172 66% 45% / 0.5); }
          50%      { transform: scale(1.2); box-shadow: 0 0 0 4px hsl(172 66% 45% / 0); }
        }
        .sf-fade-in   { animation: sfFadeSlideIn 0.8s ease-out forwards; opacity: 0; }
        .sf-marquee   { animation: sfMarquee 40s linear infinite; }
        .sf-d1 { animation-delay: 0.1s; }
        .sf-d2 { animation-delay: 0.2s; }
        .sf-d3 { animation-delay: 0.3s; }
        .sf-d4 { animation-delay: 0.4s; }
        .sf-d5 { animation-delay: 0.5s; }
        .sf-scan       { animation: sfScan 6s ease-in-out infinite; animation-delay: 1.5s; }
        .sf-glow-pulse { animation: sfGlowPulse 4s ease-in-out infinite; }
        .sf-live-dot   { animation: sfLiveDot 2s ease-in-out infinite; }
      `}</style>

      {/* Background workspace photo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80)",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 15%, black 75%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 15%, black 75%, transparent 100%)",
        }}
      />

      {/* Teal radial glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 50%, hsl(172 66% 45% / 0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-36 md:pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-4">

            {/* Badge */}
            <div className="sf-fade-in sf-d1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md hover:bg-white/10 transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(172,66%,45%)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(172,66%,45%)]" />
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Smart Workplace Platform
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1
              className="sf-fade-in sf-d2 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tighter leading-[0.92]"
              style={{
                maskImage:
                  "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
              }}
            >
              Know what's<br />
              booked{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, hsl(172,66%,55%) 0%, hsl(172,66%,75%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                vs used.
              </span>
            </h1>

            {/* Description */}
            <p className="sf-fade-in sf-d3 max-w-xl text-lg text-zinc-400 leading-relaxed">
              SpaceFlow gives SMBs and coworking operators real-time visibility
              into space utilization — so you stop guessing and start optimizing.
            </p>

            {/* CTA Buttons */}
            <div className="sf-fade-in sf-d4 flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(172,66%,50%) 0%, hsl(172,66%,38%) 100%)",
                }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#features"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
              >
                See Features
              </a>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-5 space-y-5 lg:mt-8">

            {/* Glassmorphism stats card */}
            <div
              ref={cardRef}
              className="sf-fade-in sf-d5 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-2xl"
            >
              {/* Animated scan line */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-20">
                <div
                  className="sf-scan absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.035] to-transparent"
                />
              </div>

              {/* Animated glow orb */}
              <div
                className="sf-glow-pulse absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: "hsl(172 66% 45% / 0.15)" }}
              />

              <div className="relative z-10">
                {/* Top metric — animated icon + CountUp */}
                <div className="flex items-center gap-4 mb-7">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/20"
                    style={{ background: "hsl(172 66% 45% / 0.15)" }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TrendingUp className="h-6 w-6" style={{ color: "hsl(172,66%,55%)" }} />
                  </motion.div>

                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">
                      <CountUp target={35} suffix="%" duration={1600} />
                    </div>
                    <motion.div
                      className="text-sm text-zinc-400"
                      initial={{ opacity: 0, x: -6 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.75, duration: 0.4 }}
                    >
                      Average space wasted (industry)
                    </motion.div>
                  </div>
                </div>

                {/* Progress bar — animates from 0 → 78% */}
                <div className="space-y-2.5 mb-7">
                  <div className="flex justify-between text-sm">
                    <motion.span
                      className="text-zinc-400"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.9 }}
                    >
                      Ghost Booking Reduction
                    </motion.span>
                    <motion.span
                      className="text-white font-medium tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 1.1 }}
                    >
                      <CountUp target={78} suffix="%" duration={1900} />
                    </motion.span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/70">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(90deg, hsl(172,66%,40%) 0%, hsl(172,66%,60%) 100%)",
                      }}
                      initial={{ width: "0%" }}
                      animate={inView ? { width: "78%" } : {}}
                      transition={{ delay: 0.95, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* Shimmer on the bar */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={inView ? { x: "200%" } : {}}
                        transition={{ delay: 2.0, duration: 0.8, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-6" />

                {/* Mini stats — staggered entrance */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  {/* 2.4× Faster */}
                  <motion.div
                    className="flex flex-col items-center justify-center cursor-default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <span className="text-xl font-bold text-white sm:text-2xl tabular-nums">
                      <CountUp target={2.4} suffix="×" decimals={1} duration={1700} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">
                      Faster Booking
                    </span>
                  </motion.div>

                  <div className="w-px bg-white/10 mx-auto" />

                  {/* 89% Satisfaction */}
                  <motion.div
                    className="flex flex-col items-center justify-center cursor-default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <span className="text-xl font-bold text-white sm:text-2xl tabular-nums">
                      <CountUp target={89} suffix="%" duration={1800} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">
                      Satisfaction
                    </span>
                  </motion.div>

                  <div className="w-px bg-white/10 mx-auto" />

                  {/* <5min Setup */}
                  <motion.div
                    className="flex flex-col items-center justify-center cursor-default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <span className="text-xl font-bold text-white sm:text-2xl">&lt;5min</span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">
                      Setup
                    </span>
                  </motion.div>
                </div>

                {/* Tags */}
                <motion.div
                  className="mt-7 flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.8, duration: 0.4 }}
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <span className="relative flex h-2 w-2">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: "hsl(172,66%,55%)" }}
                      />
                      <span
                        className="sf-live-dot relative inline-flex rounded-full h-2 w-2"
                        style={{ background: "hsl(172,66%,45%)" }}
                      />
                    </span>
                    LIVE DATA
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <Sparkles className="w-3 h-3" style={{ color: "hsl(172,66%,55%)" }} />
                    AI POWERED
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Marquee card */}
            <div className="sf-fade-in sf-d5 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-7 backdrop-blur-xl">
              <h3 className="mb-5 px-7 text-sm font-medium text-zinc-400">
                Trusted by growing teams worldwide
              </h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                }}
              >
                <div className="sf-marquee flex gap-10 whitespace-nowrap px-4">
                  {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 opacity-40 transition-all hover:opacity-100 hover:scale-105 cursor-default"
                    >
                      <client.icon className="h-5 w-5 text-white" />
                      <span className="text-base font-bold text-white tracking-tight">
                        {client.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
