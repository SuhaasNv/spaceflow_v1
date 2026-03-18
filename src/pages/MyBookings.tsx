import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";

const initialBookings = [
  { id: 1, space: "Meeting Room A", date: "Mar 18, 2026", time: "10:00 – 11:30", floor: "1st", status: "Upcoming" },
  { id: 2, space: "Hot Desk #7", date: "Mar 18, 2026", time: "09:00 – 17:00", floor: "2nd", status: "Active" },
  { id: 3, space: "Conference Hall", date: "Mar 19, 2026", time: "14:00 – 15:00", floor: "3rd", status: "Upcoming" },
  { id: 4, space: "Phone Booth #2", date: "Mar 17, 2026", time: "11:00 – 11:30", floor: "1st", status: "Completed" },
  { id: 5, space: "Lounge Area", date: "Mar 16, 2026", time: "13:00 – 14:00", floor: "1st", status: "Completed" },
];

const MyBookings = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const handleCancel = (id: number) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setCancelId(null);
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage your space reservations.</p>
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setCancelId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-8 shadow-xl border border-border max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold font-display mb-2">Cancel booking?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                This will cancel your reservation for{" "}
                <strong>{bookings.find((b) => b.id === cancelId)?.space}</strong>.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCancelId(null)}>Keep</Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleCancel(cancelId)}>Cancel it</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StaggerContainer className="space-y-3">
        {bookings.map((booking) => (
          <StaggerItem key={booking.id}>
            <Card className="border-border hover:bg-muted/30 transition-colors duration-150">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold">{booking.space}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} />{booking.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} />{booking.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} />{booking.floor} Floor</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    booking.status === "Active" ? "bg-primary/10 text-primary" :
                    booking.status === "Upcoming" ? "bg-accent/10 text-accent" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {booking.status}
                  </span>
                  {booking.status !== "Completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelId(booking.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
};

export default MyBookings;
