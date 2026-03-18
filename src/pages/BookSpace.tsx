import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Monitor, Phone, Coffee, MapPin, Check, Building2, Loader2, Search, CalendarClock, Lock, Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  capacity: number;
  isActive: boolean;
}

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MEETING_ROOM: Users,
  DESK: Monitor,
  PHONE_BOOTH: Phone,
  COLLABORATION_AREA: Coffee,
  OFFICE: Building2,
};

const typeLabel: Record<string, string> = {
  MEETING_ROOM: "Meeting Room",
  DESK: "Hot Desk",
  PHONE_BOOTH: "Phone Booth",
  COLLABORATION_AREA: "Collaboration Area",
  OFFICE: "Office",
};

const BookSpace = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [startSlot, setStartSlot] = useState("");
  const [endSlot, setEndSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [attendeeCount, setAttendeeCount] = useState("");
  const [bookedSpace, setBookedSpace] = useState<Space | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Availability filter — seeds from last AI-booked time (if any) or defaults to now
  const [avDate, setAvDate] = useState<string>("");
  const [avStart, setAvStart] = useState<string>("");
  const [avEnd, setAvEnd] = useState<string>("");

  // One-time init: read stored booking time or default to current slot
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const getNow = () => {
      const d = new Date();
      const m = d.getMinutes() < 30 ? 30 : 0;
      const hStart = Math.min(d.getMinutes() < 30 ? d.getHours() : d.getHours() + 1, 21);
      const hEnd = Math.min(hStart + 1, 22);
      return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        start: `${pad(hStart)}:${pad(m)}`,
        end: `${pad(hEnd)}:${pad(m)}`,
      };
    };

    try {
      const raw = localStorage.getItem("sf-last-booked-time");
      if (raw) {
        const { date, start, end } = JSON.parse(raw) as { date: string; start: string; end: string };
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        if (date >= todayStr) {
          localStorage.removeItem("sf-last-booked-time");
          setAvDate(date);
          setAvStart(start);
          setAvEnd(end);
          return;
        }
        localStorage.removeItem("sf-last-booked-time");
      }
    } catch {
      // ignore
    }
    const now = getNow();
    setAvDate(now.date);
    setAvStart(now.start);
    setAvEnd(now.end);
  }, []);

  // Smart AI booking assistant
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<{
    date?: string;
    startSlot?: string;
    endSlot?: string;
    spaceType?: string;
    suggestedSpaceIds?: string[];
    explanation?: string;
    confidence?: number;
    provider?: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => api.get<{ spaces: Space[] }>("/api/spaces"),
  });

  const spaces = data?.spaces ?? [];

  // Build ISO strings from availability filter
  const avStartISO = useMemo(() => {
    if (!avDate || !avStart) return null;
    return new Date(`${avDate}T${avStart}`).toISOString();
  }, [avDate, avStart]);

  const avEndISO = useMemo(() => {
    if (!avDate || !avEnd) return null;
    return new Date(`${avDate}T${avEnd}`).toISOString();
  }, [avDate, avEnd]);

  const { data: occupiedData } = useQuery({
    queryKey: ["occupied-spaces", avStartISO, avEndISO],
    queryFn: () =>
      api.get<{ occupiedSpaceIds: string[] }>(
        `/api/bookings/occupied-spaces?start=${avStartISO}&end=${avEndISO}`
      ),
    enabled: !!(avStartISO && avEndISO),
  });

  const occupiedIds = new Set(occupiedData?.occupiedSpaceIds ?? []);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await api.post<typeof aiResult>("/api/ai/smart-booking", { query: aiQuery });
      setAiResult(result);
      // Apply parsed values to availability filter
      if (result?.date) setAvDate(result.date);
      if (result?.startSlot) setAvStart(result.startSlot);
      if (result?.endSlot) setAvEnd(result.endSlot);
    } catch (err: unknown) {
      toast.error((err as Error).message || "AI couldn't parse your request. Try selecting manually.");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAi = () => {
    setAiQuery("");
    setAiResult(null);
    setAvDate("");
    setAvStart("");
    setAvEnd("");
  };

  const floors = [...new Set(spaces.map((s) => s.floor).filter(Boolean))] as string[];

  const filtered = spaces.filter((s) => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (floorFilter !== "all" && s.floor !== floorFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bookMutation = useMutation({
    mutationFn: (data: {
      spaceId: string;
      startTime: string;
      endTime: string;
      purpose?: string;
      attendeeCount?: number;
    }) => api.post<{ booking: unknown }>("/api/bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["occupied-spaces"] });
      setBookedSpace(selectedSpace);
      setShowModal(false);
      setSelectedSpace(null);
      setBookingDate(avDate || "");
      setStartSlot(avStart || "");
      setEndSlot(avEnd || "");
      setPurpose("");
      setAttendeeCount("");
    },
    onError: (err: Error) => {
      // On conflict (409) refresh the grid immediately so the taken space blacks out
      if (err.message?.toLowerCase().includes("already booked") || err.message?.toLowerCase().includes("just booked")) {
        queryClient.invalidateQueries({ queryKey: ["occupied-spaces"] });
        toast.error("That space was just taken — the grid has been refreshed. Please choose another.");
      } else {
        toast.error(err.message || "Booking failed. Please try another time.");
      }
      setShowModal(false);
    },
  });

  // ── Date options: today + next 13 days ──
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = i === 0
      ? "Today"
      : i === 1
      ? "Tomorrow"
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { value: iso, label };
  });

  // ── Time slots: 07:00 → 21:30 in 30-min increments ──
  const allTimeSlots = Array.from({ length: 30 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const label = new Date(`2000-01-01T${value}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { value, label };
  });

  // End slots must be after start
  const endTimeSlots = startSlot
    ? allTimeSlots.filter((s) => s.value > startSlot)
    : allTimeSlots;

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !bookingDate || !startSlot || !endSlot) return;

    bookMutation.mutate({
      spaceId: selectedSpace.id,
      startTime: new Date(`${bookingDate}T${startSlot}`).toISOString(),
      endTime: new Date(`${bookingDate}T${endSlot}`).toISOString(),
      purpose: purpose || undefined,
      attendeeCount: attendeeCount ? parseInt(attendeeCount) : undefined,
    });
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Book a Space</h1>
        <p className="text-muted-foreground mt-1">Find and reserve the perfect spot.</p>
      </div>

      {/* ── AI Smart Booking ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Smart Booking</span>
          <span className="text-xs text-muted-foreground ml-1">— describe what you need in plain English</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder='e.g. "Book me a quiet room for 2 people this Thursday 2-4pm"'
            className="flex-1 bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
          />
          <Button
            onClick={handleAiSearch}
            disabled={aiLoading || !aiQuery.trim()}
            className="gradient-primary text-primary-foreground shrink-0"
            size="sm"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Find</span>
              </>
            )}
          </Button>
          {aiResult && (
            <Button variant="ghost" size="sm" onClick={clearAi} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* AI result explanation */}
        <AnimatePresence>
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-muted-foreground">{aiResult.explanation}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {aiResult.date && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {new Date(aiResult.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                )}
                {aiResult.startSlot && aiResult.endSlot && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {aiResult.startSlot} – {aiResult.endSlot}
                  </span>
                )}
                {aiResult.suggestedSpaceIds && aiResult.suggestedSpaceIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {aiResult.suggestedSpaceIds.length} space{aiResult.suggestedSpaceIds.length > 1 ? "s" : ""} suggested
                  </span>
                )}
                {aiResult.confidence && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {aiResult.confidence}% confidence
                  </span>
                )}
                {aiResult.provider && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    via {aiResult.provider}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                AI suggestions require your confirmation before booking.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Availability checker */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Availability</span>
          <span className="text-xs text-muted-foreground">— showing spaces for selected window</span>
          {avStartISO && avEndISO && (
            <span className="ml-auto text-xs">
              {occupiedIds.size > 0 ? (
                <span className="text-destructive font-medium">{occupiedIds.size} space{occupiedIds.size > 1 ? "s" : ""} taken</span>
              ) : (
                <span className="text-primary font-medium">All spaces free</span>
              )}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Date */}
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
            <Select value={avDate} onValueChange={(v) => { setAvDate(v); setAvStart(""); setAvEnd(""); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pick a date" />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Start */}
          <div className="flex-1 min-w-[120px]">
            <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
            <Select value={avStart} onValueChange={(v) => { setAvStart(v); if (avEnd && avEnd <= v) setAvEnd(""); }} disabled={!avDate}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Start time" />
              </SelectTrigger>
              <SelectContent>
                {allTimeSlots.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* End */}
          <div className="flex-1 min-w-[120px]">
            <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
            <Select value={avEnd} onValueChange={setAvEnd} disabled={!avStart}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="End time" />
              </SelectTrigger>
              <SelectContent>
                {allTimeSlots.filter((t) => t.value > avStart).map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Reset to now */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const d = new Date();
              const date = d.toISOString().slice(0, 10);
              const m = d.getMinutes() < 30 ? 30 : 0;
              const h = d.getMinutes() < 30 ? d.getHours() : d.getHours() + 1;
              const startH = Math.min(h, 21);
              const endH = Math.min(h + 1, 22);
              setAvDate(date);
              setAvStart(`${String(startH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
              setAvEnd(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
            }}
          >
            Now
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spaces…"
            className="pl-9 w-48"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
            <SelectItem value="DESK">Hot Desk</SelectItem>
            <SelectItem value="PHONE_BOOTH">Phone Booth</SelectItem>
            <SelectItem value="COLLABORATION_AREA">Collaboration</SelectItem>
            <SelectItem value="OFFICE">Office</SelectItem>
          </SelectContent>
        </Select>
        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floors</SelectItem>
            {floors.map((f) => (
              <SelectItem key={f} value={f}>
                {f} Floor
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Booking success */}
      <AnimatePresence>
        {bookedSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setBookedSpace(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-card rounded-xl p-10 text-center shadow-xl border border-border max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4"
              >
                <Check className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <h2 className="text-xl font-bold font-display mb-1">You're all set!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                <strong>{bookedSpace.name}</strong> is reserved for you.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBookedSpace(null)}>
                  Book another
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={() => { setBookedSpace(null); window.location.href = "/dashboard/bookings"; }}
                >
                  View bookings
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {showModal && selectedSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-8 shadow-xl border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold font-display mb-1">Book {selectedSpace.name}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {selectedSpace.floor && `${selectedSpace.floor} Floor`}
                {selectedSpace.building && ` · ${selectedSpace.building}`}
                {` · Capacity: ${selectedSpace.capacity}`}
              </p>

              <form onSubmit={handleBookSubmit} className="space-y-4">
                {/* Date */}
                <div>
                  <Label className="text-sm">Date</Label>
                  <Select
                    value={bookingDate}
                    onValueChange={(v) => {
                      setBookingDate(v);
                      setStartSlot("");
                      setEndSlot("");
                    }}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select a date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start / End time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Start time</Label>
                    <Select
                      value={startSlot}
                      onValueChange={(v) => {
                        setStartSlot(v);
                        if (endSlot && endSlot <= v) setEndSlot("");
                      }}
                      disabled={!bookingDate}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTimeSlots.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">End time</Label>
                    <Select
                      value={endSlot}
                      onValueChange={setEndSlot}
                      disabled={!startSlot}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent>
                        {endTimeSlots.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Purpose (optional)</Label>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Team standup"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Attendees (optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedSpace.capacity}
                    value={attendeeCount}
                    onChange={(e) => setAttendeeCount(e.target.value)}
                    placeholder={`Max ${selectedSpace.capacity}`}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={bookMutation.isPending || !bookingDate || !startSlot || !endSlot}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    {bookMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Booking…
                      </span>
                    ) : (
                      "Confirm booking"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No spaces match your filters.</p>
        </div>
      ) : (
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((space) => {
            const Icon = typeIconMap[space.type] ?? Building2;
            const isOccupied = occupiedIds.has(space.id);
            const isAiSuggested = aiResult?.suggestedSpaceIds?.includes(space.id) ?? false;
            return (
              <StaggerItem key={space.id}>
                <Card
                  className={`relative overflow-hidden transition-all ${
                    isOccupied
                      ? "opacity-70 cursor-not-allowed border-border"
                      : isAiSuggested
                      ? "hover-lift cursor-pointer group border-primary ring-1 ring-primary/40"
                      : "hover-lift cursor-pointer group border-border"
                  }`}
                  onClick={() => {
                    if (!isOccupied) {
                      setSelectedSpace(space);
                      setBookingDate(avDate || "");
                      setStartSlot(avStart || "");
                      setEndSlot(avEnd || "");
                      setShowModal(true);
                    }
                  }}
                >
                  {/* Blackout overlay for occupied spaces */}
                  {isOccupied && (
                    <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 rounded-xl">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">Already Booked</span>
                      {avStart && avEnd && (
                        <span className="text-[10px] text-muted-foreground/70">
                          {allTimeSlots.find(t => t.value === avStart)?.label} – {allTimeSlots.find(t => t.value === avEnd)?.label}
                        </span>
                      )}
                    </div>
                  )}

                  <CardContent className="p-5">
                    {isAiSuggested && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-primary mb-2">
                        <Sparkles className="h-3 w-3" /> AI Suggested
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                        isOccupied ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"
                      }`}>
                        <Icon className={`h-5 w-5 ${isOccupied ? "text-muted-foreground" : "text-primary"}`} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOccupied ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        {typeLabel[space.type] ?? space.type}
                      </span>
                    </div>
                    <h3 className="font-display font-bold mb-1">{space.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {space.floor && <span className="flex items-center gap-1"><MapPin size={12} />{space.floor}</span>}
                      <span className="flex items-center gap-1"><Users size={12} />{space.capacity}</span>
                      {space.building && <span className="text-muted-foreground/70">{space.building}</span>}
                    </div>
                    <Button
                      size="sm"
                      disabled={isOccupied}
                      className={`w-full font-medium ${
                        isOccupied
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "gradient-primary text-primary-foreground hover:scale-[1.02] transition-transform duration-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOccupied) {
                          setSelectedSpace(space);
                          setBookingDate(avDate || "");
                          setStartSlot(avStart || "");
                          setEndSlot(avEnd || "");
                          setShowModal(true);
                        }
                      }}
                    >
                      {isOccupied ? "Not Available" : "Book Now"}
                    </Button>
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

export default BookSpace;
