import { motion } from "framer-motion";

export const SkeletonCard = () => (
  <div className="rounded-lg bg-card border border-border p-6 space-y-4">
    <div className="shimmer h-4 w-3/4 rounded" />
    <div className="shimmer h-3 w-full rounded" />
    <div className="shimmer h-3 w-5/6 rounded" />
    <div className="shimmer h-10 w-1/3 rounded-md mt-4" />
  </div>
);

export const SkeletonChart = () => (
  <div className="rounded-lg bg-card border border-border p-6 space-y-4">
    <div className="shimmer h-4 w-1/3 rounded" />
    <div className="flex items-end gap-2 h-40">
      {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
        <div key={i} className="shimmer flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
}

export const CountUp = ({ target, suffix = "", prefix = "" }: CountUpProps) => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {prefix}
      <motion.span
        initial={0}
        animate={target}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {target}
      </motion.span>
      {suffix}
    </motion.span>
  </motion.span>
);
