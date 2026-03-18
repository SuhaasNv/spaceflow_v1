import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, X, Loader2, AlertTriangle, Users,
  Search, Filter, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  user: { id: string; name: string; email: string };
}

type StatusFilter = "ALL" | "ACTIVE" | "CANCELLED" | "COMPLETED";

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  ACTIVE:    "bg-primary/10 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
  COMPLETED: "bg-muted text-muted-foreground",
};

const AllBookings = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: () => api.get<{ bookings: Booking[] }>("/api/bookings"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.delete(`/api/bookings/${id}`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCancelId(null);
      setCancelReason("");
      toast.success("Booking cancelled");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const allBookings = data?.bookings ?? [];

  const filtered = allBookings.filter((b) => {
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.user.name.toLowerCase().includes(q) ||
      b.user.email.toLowerCase().includes(q) ||
      b.space.name.toLowerCase().includes(q) ||
      (b.purpose?.toLowerCase().includes(q) ?? false);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL:       allBookings.length,
    ACTIVE:    allBookings.filter((b) => b.status === "ACTIVE").length,
    CANCELLED: allBookings.filter((b) => b.status === "CANCELLED").length,
    COMPLETED: allBookings.filter((b) => b.status === "COMPLETED").length,
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">All Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage all space reservations across your organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
          <Users className="h-4 w-4" />
          <span>{allBookings.length} total bookings</span>
        </div>
      </div>

      {/* Search and Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, space, or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filter
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Status filter tabs */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="flex flex-wrap gap-2 pb-1">
              {(["ALL", "ACTIVE", "CANCELLED", "COMPLETED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}{" "}
                  <span className="opacity-70">({counts[s]})</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation modal */}
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
                    {allBookings.find((b) => b.id === cancelId)?.user.name} ·{" "}
                    {allBookings.find((b) => b.id === cancelId)?.space.name}
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
                  placeholder="e.g. Space required for maintenance, conflicting event..."
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{cancelReason.length}/500</p>
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
                  {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm cancel"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bookings found</p>
          {search && <p className="text-sm mt-1">Try adjusting your search or filters.</p>}
        </div>
      ) : (
        <StaggerContainer className="space-y-3">
          {filtered.map((booking) => {
            const isPast = new Date(booking.endTime) < new Date();
            return (
              <StaggerItem key={booking.id}>
                <Card className={`border-border transition-all ${booking.status === "CANCELLED" ? "opacity-70" : "hover-lift"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-display font-bold truncate">{booking.space.name}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor[booking.status]}`}>
                            {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                          </span>
                        </div>

                        {/* User info row */}
                        <div className="flex items-center gap-1.5 text-xs text-primary/80 mb-1.5">
                          <Users className="h-3 w-3 shrink-0" />
                          <span className="font-medium">{booking.user.name}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground truncate">{booking.user.email}</span>
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
                          {booking.attendeeCount && booking.attendeeCount > 1 && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {booking.attendeeCount} attendees
                            </span>
                          )}
                        </div>

                        {booking.purpose && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{booking.purpose}"</p>
                        )}
                        {booking.status === "CANCELLED" && booking.cancellationReason && (
                          <p className="text-xs text-destructive/70 mt-1 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {booking.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {booking.status === "ACTIVE" && !isPast && (
                        <button
                          onClick={() => setCancelId(booking.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Cancel booking"
                          title="Cancel this booking"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-6">
          Showing {filtered.length} of {allBookings.length} bookings
        </p>
      )}
    </PageTransition>
  );
};

export default AllBookings;
