import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Monitor, Phone, Coffee, MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const spaces = [
  { id: 1, name: "Meeting Room A", type: "meeting", floor: "1st", capacity: 8, icon: Users, available: true },
  { id: 2, name: "Hot Desk #3", type: "desk", floor: "2nd", capacity: 1, icon: Monitor, available: true },
  { id: 3, name: "Phone Booth #1", type: "phone", floor: "1st", capacity: 1, icon: Phone, available: false },
  { id: 4, name: "Conference Hall", type: "meeting", floor: "3rd", capacity: 30, icon: Users, available: true },
  { id: 5, name: "Lounge Area", type: "lounge", floor: "1st", capacity: 12, icon: Coffee, available: true },
  { id: 6, name: "Hot Desk #7", type: "desk", floor: "2nd", capacity: 1, icon: Monitor, available: true },
  { id: 7, name: "Phone Booth #2", type: "phone", floor: "1st", capacity: 1, icon: Phone, available: true },
  { id: 8, name: "Meeting Room B", type: "meeting", floor: "2nd", capacity: 6, icon: Users, available: false },
];

const BookSpace = () => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [booked, setBooked] = useState<number | null>(null);

  const filtered = spaces.filter(
    (s) => (typeFilter === "all" || s.type === typeFilter) && (floorFilter === "all" || s.floor === floorFilter)
  );

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Book a Space</h1>
        <p className="text-muted-foreground mt-1">Find and reserve the perfect spot.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="meeting">Meeting Room</SelectItem>
            <SelectItem value="desk">Hot Desk</SelectItem>
            <SelectItem value="phone">Phone Booth</SelectItem>
            <SelectItem value="lounge">Lounge</SelectItem>
          </SelectContent>
        </Select>
        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floors</SelectItem>
            <SelectItem value="1st">1st Floor</SelectItem>
            <SelectItem value="2nd">2nd Floor</SelectItem>
            <SelectItem value="3rd">3rd Floor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {booked !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setBooked(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-card rounded-xl p-10 text-center shadow-xl border border-border"
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
              <h2 className="text-xl font-bold font-display mb-1">Booked!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {spaces.find((s) => s.id === booked)?.name} is reserved for you.
              </p>
              <Button variant="outline" onClick={() => setBooked(null)}>Done</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((space) => (
          <StaggerItem key={space.id}>
            <Card className={`hover-lift border-border ${!space.available ? "opacity-50" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <space.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    space.available ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}>
                    {space.available ? "Available" : "Occupied"}
                  </span>
                </div>
                <h3 className="font-display font-bold mb-1">{space.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><MapPin size={12} />{space.floor}</span>
                  <span className="flex items-center gap-1"><Users size={12} />{space.capacity}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!space.available}
                  onClick={() => setBooked(space.id)}
                  className="w-full gradient-primary text-primary-foreground font-medium hover:scale-[1.02] transition-transform duration-200 disabled:opacity-40"
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
};

export default BookSpace;
