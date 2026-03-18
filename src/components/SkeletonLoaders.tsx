import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export const SkeletonCard = () => (
  <div className="rounded-xl bg-card border border-border p-6 space-y-4">
    <div className="flex items-center gap-3">
      <div className="shimmer h-10 w-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <div className="shimmer h-3 w-1/2 rounded" />
        <div className="shimmer h-3 w-1/3 rounded" />
      </div>
    </div>
    <div className="shimmer h-8 w-1/3 rounded" />
    <div className="shimmer h-3 w-full rounded" />
    <div className="shimmer h-3 w-5/6 rounded" />
  </div>
);

export const SkeletonChart = () => (
  <div className="rounded-xl bg-card border border-border p-6 space-y-4">
    <div className="shimmer h-4 w-1/3 rounded" />
    <div className="flex items-end gap-2 h-40">
      {[40, 65, 50, 80, 55, 70, 45, 60, 75, 30].map((h, i) => (
        <div key={i} className="shimmer flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
    <div className="flex gap-2">
      <div className="shimmer h-3 w-16 rounded" />
      <div className="shimmer h-3 w-16 rounded" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl bg-card border border-border p-6 space-y-3">
    <div className="shimmer h-4 w-1/4 rounded mb-4" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="shimmer h-4 w-1/4 rounded" />
          <div className="shimmer h-4 w-1/3 rounded" />
          <div className="shimmer h-4 w-1/6 rounded" />
          <div className="shimmer h-4 w-1/6 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="rounded-xl bg-card border border-border p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="shimmer h-10 w-10 rounded-lg" />
    </div>
    <div className="shimmer h-8 w-1/2 rounded" />
    <div className="shimmer h-3 w-2/3 rounded" />
  </div>
);

interface CountUpProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export const CountUp = ({ target, duration = 1200, suffix = "", prefix = "", decimals = 0 }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!inView) return;

    const animate = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, target, duration]);

  const displayed = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 6 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayed}{suffix}
    </motion.span>
  );
};
