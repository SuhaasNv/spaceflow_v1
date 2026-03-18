import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, X, Check, Loader2, CalendarCheck, AlertTriangle, QrCode, FileDown, ScanLine } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { downloadBookingPDF, type BookingForPDF } from "@/lib/bookingPDF";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "qrcode";

interface Booking {
  id: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  purpose?: string;
  attendeeCount?: number;
  cancellationReason?: string;
  space: { id: string; name: string; type: string; floor: string | null; building: string | null };
  user?: { id: string; name: string; email: string };
}

interface OccupancyRecord {
  id: string;
  spaceId: string;
  checkIn: string;
  checkOut: string | null;
}

function isCheckInWindow(startTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();
  return diffMs <= 15 * 60 * 1000 && diffMs >= -60 * 60 * 1000;
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const MyBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: () => api.get<{ bookings: Booking[] }>("/api/bookings?mine=true"),
  });

  const { data: occupancyData } = useQuery({
    queryKey: ["occupancy-active"],
    queryFn: () => api.get<{ records: OccupancyRecord[] }>("/api/occupancy/active"),
  });

  const bookings = bookingsData?.bookings ?? [];
  const activeOccupancy = occupancyData?.records ?? [];
  const now = new Date();

  const displayed = tab === "upcoming"
    ? bookings.filter((b) => b.status === "ACTIVE" && new Date(b.endTime) > now)
    : bookings;

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.delete(`/api/bookings/${id}`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["occupied-spaces"] });
      setCancelId(null);
      setCancelReason("");
      toast.success("Booking cancelled");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ spaceId, bookingId }: { spaceId: string; bookingId: string }) =>
      api.post<{ record: OccupancyRecord }>("/api/occupancy/checkin", { spaceId, bookingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-active"] });
      toast.success("Checked in! Enjoy your space.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkOutMutation = useMutation({
    mutationFn: (occupancyId: string) =>
      api.post("/api/occupancy/checkout", { occupancyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-active"] });
      toast.success("Checked out successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getActiveCheckIn = (spaceId: string) =>
    activeOccupancy.find((o) => o.spaceId === spaceId && !o.checkOut);

  const handleDownloadPDF = async (booking: Booking) => {
    setPdfLoadingId(booking.id);
    try {
      const checkInUrl = `${window.location.origin}/dashboard/checkin/${booking.id}`;
      // Render QR to an offscreen canvas and grab its data URL
      let qrDataUrl: string | null = null;
      try {
        const canvas = document.createElement("canvas");
        await QRCode.toCanvas(canvas, checkInUrl, { width: 200, margin: 1 });
        qrDataUrl = canvas.toDataURL("image/png");
      } catch {
        // QR in PDF is optional — continue without it
      }
      const bookingForPdf: BookingForPDF = {
        ...booking,
        user: booking.user ?? (user ? { name: user.name, email: user.email } : undefined),
      };
      await downloadBookingPDF(bookingForPdf, qrDataUrl);
      toast.success("Booking confirmation downloaded.");
    } catch (err) {
      toast.error("Failed to generate PDF. Please try again.");
      console.error(err);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const statusColor = {
    ACTIVE: "bg-primary/10 text-primary",
    CANCELLED: "bg-destructive/10 text-destructive",
    COMPLETED: "bg-muted text-muted-foreground",
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage your space reservations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
        {(["upcoming", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "upcoming" ? "Upcoming" : "All bookings"}
          </button>
        ))}
      </div>

      {/* QR Code modal */}
      <AnimatePresence>
        {qrBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setQrBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-7 shadow-xl border border-border max-w-xs w-full mx-4 flex flex-col items-center gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setQrBooking(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="text-center">
                <h2 className="font-display font-bold text-base">{qrBooking.space.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(qrBooking.startTime)} · {formatTime(qrBooking.startTime)} – {formatTime(qrBooking.endTime)}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-sm">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={`${window.location.origin}/dashboard/checkin/${qrBooking.id}`}
                  size={176}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 justify-center">
                  <ScanLine className="h-3.5 w-3.5 text-primary" />
                  Scan to check in
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Open the camera app on your phone, scan this code when you arrive at the space. Opens 15 min before your booking.
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  asChild
                >
                  <Link to={`/dashboard/checkin/${qrBooking.id}`}>
                    Open check-in page
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={pdfLoadingId === qrBooking.id}
                  onClick={() => handleDownloadPDF(qrBooking)}
                >
                  {pdfLoadingId === qrBooking.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                  )}
                  Save PDF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => { setCancelId(null); setCancelReason(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-7 shadow-xl border border-border max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-display">Cancel booking?</h2>
                  <p className="text-xs text-muted-foreground">
                    {bookings.find((b) => b.id === cancelId)?.space.name}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <Label className="text-sm mb-1.5 block">
                  Reason for cancellation <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Meeting rescheduled, not needed anymore…"
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {cancelReason.length}/500
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be visible to your Facilities Manager and Admin.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setCancelId(null); setCancelReason(""); }}
                >
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={cancelMutation.isPending || cancelReason.trim().length === 0}
                  onClick={() => cancelMutation.mutate({ id: cancelId, reason: cancelReason.trim() })}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm cancel"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bookings yet</p>
          <p className="text-sm mt-1">
            <a href="/dashboard/book" className="text-primary hover:underline">
              Book a space
            </a>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <StaggerContainer className="space-y-3">
          {displayed.map((booking) => {
            const checkedIn = getActiveCheckIn(booking.spaceId);
            const canCheckIn = booking.status === "ACTIVE" && isCheckInWindow(booking.startTime);
            const isPast = new Date(booking.endTime) < now;

            return (
              <StaggerItem key={booking.id}>
                <Card className={`border-border transition-all ${booking.status === "CANCELLED" ? "opacity-60" : "hover-lift"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-bold truncate">{booking.space.name}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor[booking.status]}`}>
                            {booking.status === "ACTIVE" ? (checkedIn ? "Checked in" : "Active") : booking.status.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(booking.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                          </span>
                          {booking.space.floor && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {booking.space.floor}
                              {booking.space.building && ` · ${booking.space.building}`}
                            </span>
                          )}
                        </div>
                        {booking.purpose && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {booking.purpose}
                          </p>
                        )}
                        {booking.status === "CANCELLED" && booking.cancellationReason && (
                          <p className="text-xs text-destructive/70 mt-1 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {booking.cancellationReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* QR code button — always visible for active bookings */}
                        {booking.status === "ACTIVE" && (
                          <button
                            onClick={() => setQrBooking(booking)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            aria-label="Show QR code"
                            title="Show QR code / check in"
                          >
                            <QrCode size={15} />
                          </button>
                        )}

                        {/* PDF download */}
                        <button
                          onClick={() => handleDownloadPDF(booking)}
                          disabled={pdfLoadingId === booking.id}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                          aria-label="Download PDF"
                          title="Download booking as PDF"
                        >
                          {pdfLoadingId === booking.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <FileDown size={15} />
                          )}
                        </button>

                        {booking.status === "ACTIVE" && !isPast && (
                          <>
                            {checkedIn ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-primary/30 text-primary h-8 px-2.5"
                                disabled={checkOutMutation.isPending}
                                onClick={() => checkOutMutation.mutate(checkedIn.id)}
                              >
                                {checkOutMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                  <><Check className="h-3 w-3 mr-1" /> Checked in</>
                                )}
                              </Button>
                            ) : (
                              <motion.div
                                animate={canCheckIn ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ repeat: canCheckIn ? Infinity : 0, duration: 2 }}
                              >
                                <Button
                                  size="sm"
                                  className={`text-xs font-medium h-8 px-2.5 ${
                                    canCheckIn
                                      ? "gradient-primary text-primary-foreground shadow-md"
                                      : "opacity-50"
                                  }`}
                                  disabled={!canCheckIn || checkInMutation.isPending}
                                  onClick={() => checkInMutation.mutate({ spaceId: booking.spaceId, bookingId: booking.id })}
                                >
                                  {checkInMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Check in"
                                  )}
                                </Button>
                              </motion.div>
                            )}
                            <button
                              onClick={() => setCancelId(booking.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Cancel booking"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </PageTransition>
  );
};

export default MyBookings;
