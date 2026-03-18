"use client";

import * as React from "react";
import { motion, PanInfo } from "framer-motion";

interface Testimonial {
  id: number;
  testimonial: string;
  author: string;
  role: string;
  avatar: string;
}

type Position = "front" | "middle" | "back";

interface TestimonialCardProps {
  handleShuffle: () => void;
  testimonial: string;
  author: string;
  role: string;
  avatar: string;
  position: Position;
  id: number;
}

export function TestimonialCard({
  handleShuffle,
  testimonial,
  author,
  role,
  avatar,
  position,
}: TestimonialCardProps) {
  const dragStartX = React.useRef(0);
  const isFront = position === "front";

  const rotateMap: Record<Position, string> = {
    front: "-6deg",
    middle: "0deg",
    back: "6deg",
  };
  const xMap: Record<Position, string> = {
    front: "0%",
    middle: "33%",
    back: "66%",
  };
  const zMap: Record<Position, number> = {
    front: 2,
    middle: 1,
    back: 0,
  };

  return (
    <motion.div
      style={{ zIndex: zMap[position] }}
      animate={{
        rotate: rotateMap[position],
        x: xMap[position],
      }}
      drag={isFront}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        dragStartX.current = info.point.x;
      }}
      onDragEnd={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (dragStartX.current - info.point.x > 120) {
          handleShuffle();
        }
        dragStartX.current = 0;
      }}
      transition={{ duration: 0.35 }}
      className={`absolute left-0 top-0 grid h-[420px] w-[320px] select-none place-content-center space-y-6 rounded-2xl border border-border bg-card/80 p-7 shadow-2xl backdrop-blur-md ${
        isFront ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <img
        src={avatar}
        alt={`Avatar of ${author}`}
        className="pointer-events-none mx-auto h-24 w-24 rounded-full border-2 border-primary/30 bg-muted object-cover"
      />
      <span className="text-center text-base italic text-muted-foreground leading-relaxed">
        "{testimonial}"
      </span>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{author}</p>
        <p className="text-xs text-primary mt-0.5">{role}</p>
      </div>
    </motion.div>
  );
}

const spaceflowTestimonials: Testimonial[] = [
  {
    id: 1,
    testimonial:
      "We cut our no-show rate from 34% to under 8% in the first month. SpaceFlow showed us exactly which rooms were being ghost-booked — we had no idea.",
    author: "Sarah Chen",
    role: "Head of Operations @ Nexus Coworking",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&auto=format",
  },
  {
    id: 2,
    testimonial:
      "Every other tool just showed me a calendar. SpaceFlow shows me the gap between what's booked and what's actually used. That gap was costing us real money.",
    author: "Marcus Rivera",
    role: "Facilities Manager @ Luminary Group",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&auto=format",
  },
  {
    id: 3,
    testimonial:
      "The AI recommendations are genuinely useful — not vague suggestions, but specific actions with the data behind them. And it never changes anything automatically. That trust matters.",
    author: "Priya Patel",
    role: "Office Manager @ Bridgewater SMB",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&auto=format",
  },
];

export function ShuffleCards() {
  const [positions, setPositions] = React.useState<Position[]>([
    "front",
    "middle",
    "back",
  ]);

  const handleShuffle = () => {
    setPositions((prev) => {
      const next = [...prev] as Position[];
      const last = next.pop()!;
      next.unshift(last);
      return next;
    });
  };

  return (
    <div className="relative h-[420px] w-[320px]">
      {spaceflowTestimonials.map((t, index) => (
        <TestimonialCard
          key={t.id}
          {...t}
          handleShuffle={handleShuffle}
          position={positions[index]}
        />
      ))}
    </div>
  );
}
