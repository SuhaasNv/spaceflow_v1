import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/animations";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Booking {
  id: string;
  spaceId: string;
  userId: string;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  startTime: string;
  endTime: string;
  purpose?: string;
  attendeeCount?: number;
  space: { id: string; name: string; type: string; floor: string | null; building: string | null };
  user?: { id: string; name: string; email: string };
}

interface OccupancyRecord {
  id: string;
  spaceId: string;
  checkIn: string;
  checkOut: string | null;
}

function isWithinCheckInWindow(startTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();
  // Allow 15 min early → 60 min late
  return diffMs <= 15 * 60 * 1000 && diffMs >= -60 * 60 * 1000;
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function CheckIn() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasAutoCheckedIn = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-checkin", id],
    queryFn: () => api.get<{ booking: Booking }>(`/api/bookings/${id}`),
    enabled: !!id,
  });

  const { data: occupancyData } = useQuery({
    queryKey: ["occupancy-active"],
    queryFn: () => api.get<{ records: OccupancyRecord[] }>("/api/occupancy/active"),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ spaceId, bookingId }: { spaceId: string; bookingId: string }) =>
      api.post<{ record: OccupancyRecord }>("/api/occupancy/checkin", { spaceId, bookingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-active"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Checked in! Enjoy your space.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const booking = data?.booking;
  const activeOccupancy = occupancyData?.records ?? [];
  const alreadyCheckedIn = booking ? activeOccupancy.some((o) => o.spaceId === booking.spaceId && !o.checkOut) : false;
  const isOwner = booking?.userId === user?.id;
  const isAdminOrFM = user?.role === "ADMIN" || user?.role === "FACILITIES_MANAGER";
  const canAccess = isOwner || isAdminOrFM;
  const inWindow = booking ? isWithinCheckInWindow(booking.startTime) : false;

  // Auto check-in if scanned within time window
  useEffect(() => {
    if (
      booking &&
      canAccess &&
      inWindow &&
      !alreadyCheckedIn &&
      booking.status === "ACTIVE" &&
      !hasAutoCheckedIn.current &&
      !checkInMutation.isPending
    ) {
      hasAutoCheckedIn.current = true;
      checkInMutation.mutate({ spaceId: booking.spaceId, bookingId: booking.id });
    }
  }, [booking, canAccess, inWindow, alreadyCheckedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkInUrl = `${window.location.origin}/dashboard/checkin/${id}`;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading booking…</p>
        </div>
      </PageTransition>
    );
  }

  if (isError || !booking) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Booking not found</h2>
          <p className="text-muted-foreground">This QR code may have expired or the booking no longer exists.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Bookings
            </Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!canAccess) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Access denied</h2>
          <p className="text-muted-foreground">This check-in link belongs to a different account.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" /> My Bookings
            </Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  const isCancelled = booking.status === "CANCELLED";
  const isPast = new Date(booking.endTime) < new Date();
  const isTooEarly = !inWindow && !isPast && !isCancelled;

  const timeUntilStart = new Date(booking.startTime).getTime() - Date.now();
  const minsUntil = Math.ceil(timeUntilStart / 60000);

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to="/dashboard/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Bookings
        </Link>

        {/* Status card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-lg mb-5"
        >
          {/* Icon + status */}
          <div className="flex flex-col items-center text-center mb-6">
            {checkInMutation.isPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3"
              >
                <ScanLine className="h-8 w-8 text-primary" />
              </motion.div>
            ) : alreadyCheckedIn || checkInMutation.isSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3"
              >
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </motion.div>
            ) : isCancelled ? (
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <XCircle className="h-9 w-9 text-destructive" />
              </div>
            ) : isTooEarly ? (
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                <Clock className="h-9 w-9 text-amber-500" />
              </div>
            ) : isPast ? (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="h-9 w-9 text-muted-foreground" />
              </div>
            ) : null}

            <h1 className="text-xl font-bold font-display">
              {checkInMutation.isPending
                ? "Checking you in…"
                : alreadyCheckedIn || checkInMutation.isSuccess
                  ? "You're checked in!"
                  : isCancelled
                    ? "Booking Cancelled"
                    : isTooEarly
                      ? `Check-in opens in ${minsUntil} min`
                      : isPast
                        ? "Booking has ended"
                        : "Check In"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {alreadyCheckedIn || checkInMutation.isSuccess
                ? "Enjoy your space. Check out when you leave."
                : isCancelled
                  ? "This booking was cancelled and cannot be used for check-in."
                  : isTooEarly
                    ? "The check-in window opens 15 minutes before your start time."
                    : isPast
                      ? "This booking's time slot has passed."
                      : "Scan confirmed. You're all set!"}
            </p>
          </div>

          {/* Booking details */}
          <div className="space-y-2.5 border-t border-border pt-5">
            <h2 className="font-display font-bold text-base">{booking.space.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(booking.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {fmtTime(booking.startTime)} – {fmtTime(booking.endTime)}
              </span>
              {(booking.space.floor || booking.space.building) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {[booking.space.floor, booking.space.building].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            {booking.purpose && (
              <p className="text-sm italic text-muted-foreground">{booking.purpose}</p>
            )}
          </div>

          {/* Manual check-in button (if auto check-in failed or not in window yet) */}
          {!alreadyCheckedIn && !checkInMutation.isSuccess && inWindow && booking.status === "ACTIVE" && (
            <Button
              className="w-full mt-5"
              disabled={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate({ spaceId: booking.spaceId, bookingId: booking.id })}
            >
              {checkInMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Check in now
            </Button>
          )}
        </motion.div>

        {/* QR code card — useful for the room display / FM to verify */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col items-center gap-4"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your booking QR code</p>
          <div className="p-3 bg-white rounded-xl">
            <QRCodeCanvas value={checkInUrl} size={160} level="M" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Share this QR so a Facilities Manager can verify your booking, or scan it on another device to check in.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
