import React from "react";
import { Link } from "react-router-dom";
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

const CLIENTS = [
  { name: "Nexus Hub",     icon: Building2 },
  { name: "FlexWork",      icon: Layers    },
  { name: "Orbit Spaces",  icon: Globe     },
  { name: "Basecamp Co.",  icon: Cpu       },
  { name: "TechNest",      icon: BarChart2 },
  { name: "Vertex Labs",   icon: Wifi      },
  { name: "Luminary",      icon: Layout    },
];

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">{label}</span>
  </div>
);

export default function GlassmorphismHero() {
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
        .sf-fade-in   { animation: sfFadeSlideIn 0.8s ease-out forwards; opacity: 0; }
        .sf-marquee   { animation: sfMarquee 40s linear infinite; }
        .sf-d1 { animation-delay: 0.1s; }
        .sf-d2 { animation-delay: 0.2s; }
        .sf-d3 { animation-delay: 0.3s; }
        .sf-d4 { animation-delay: 0.4s; }
        .sf-d5 { animation-delay: 0.5s; }
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
            <div className="sf-fade-in sf-d5 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-2xl">
              {/* Glow */}
              <div
                className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: "hsl(172 66% 45% / 0.12)" }}
              />

              <div className="relative z-10">
                {/* Top metric */}
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/20"
                    style={{ background: "hsl(172 66% 45% / 0.15)" }}>
                    <TrendingUp className="h-6 w-6" style={{ color: "hsl(172,66%,55%)" }} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">35%</div>
                    <div className="text-sm text-zinc-400">Average space wasted (industry)</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2.5 mb-7">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Ghost Booking Reduction</span>
                    <span className="text-white font-medium">78%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/70">
                    <div
                      className="h-full w-[78%] rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, hsl(172,66%,40%) 0%, hsl(172,66%,60%) 100%)",
                      }}
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-6" />

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="2.4×"  label="Faster Booking" />
                  <div className="w-px bg-white/10 mx-auto" />
                  <StatItem value="89%"   label="Satisfaction" />
                  <div className="w-px bg-white/10 mx-auto" />
                  <StatItem value="<5min" label="Setup" />
                </div>

                {/* Tags */}
                <div className="mt-7 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: "hsl(172,66%,55%)" }} />
                      <span className="relative inline-flex rounded-full h-2 w-2"
                        style={{ background: "hsl(172,66%,45%)" }} />
                    </span>
                    LIVE DATA
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <Sparkles className="w-3 h-3" style={{ color: "hsl(172,66%,55%)" }} />
                    AI POWERED
                  </div>
                </div>
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
