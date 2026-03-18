import jsPDF from "jspdf";

export interface BookingForPDF {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  attendeeCount?: number;
  space: { name: string; type: string; floor: string | null; building: string | null };
  user?: { name: string; email: string };
}

function spaceTypeLabel(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export async function downloadBookingPDF(booking: BookingForPDF, qrDataUrl: string | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SpaceFlow", margin, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("Smart Workplace Platform", margin, 21);

  // Status badge (top right)
  const statusBg =
    booking.status === "ACTIVE" ? [22, 163, 74] : booking.status === "CANCELLED" ? [220, 38, 38] : [100, 116, 139];
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(W - margin - 28, 10, 28, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(booking.status, W - margin - 14, 15.5, { align: "center" });

  // ── Title ────────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Booking Confirmation", margin, 46);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Reference: #${booking.id.slice(0, 8).toUpperCase()}`, margin, 53);

  // ── Thin divider ─────────────────────────────────────────────────────────
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, 57, W - margin, 57);

  // ── Two-column layout ────────────────────────────────────────────────────
  let y = 65;

  const sectionLabel = (label: string) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), margin, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1.5, margin + contentW, y + 1.5);
    y += 7;
  };

  const row = (label: string, value: string, indent = margin) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, indent, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(value, indent + 42, y);
    y += 6.5;
  };

  // Space details
  sectionLabel("Space Details");
  row("Space Name", booking.space.name);
  row("Type", spaceTypeLabel(booking.space.type));
  if (booking.space.floor || booking.space.building) {
    row(
      "Location",
      [booking.space.floor, booking.space.building].filter(Boolean).join(" · "),
    );
  }
  y += 3;

  // Date & Time
  sectionLabel("Date & Time");
  row("Date", fmtDate(booking.startTime));
  row("Time", `${fmtTime(booking.startTime)} – ${fmtTime(booking.endTime)}`);
  const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
  row("Duration", `${Math.round(durationMs / 60000)} minutes`);
  y += 3;

  // Booking details
  sectionLabel("Booking Details");
  if (booking.purpose) row("Purpose", booking.purpose);
  if (booking.attendeeCount) row("Attendees", String(booking.attendeeCount));
  if (booking.user?.name) row("Booked by", booking.user.name);
  y += 3;

  // ── QR code section ──────────────────────────────────────────────────────
  if (qrDataUrl) {
    sectionLabel("QR Code Check-In");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Scan the QR code below when you arrive at the space to check in.", margin, y);
    y += 7;

    const qrSize = 45;
    doc.addImage(qrDataUrl, "PNG", margin, y, qrSize, qrSize);

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Valid 15 min before to 60 min after your start time.", margin + qrSize + 6, y + 6);
    doc.text("Requires a SpaceFlow account on the scanning device.", margin + qrSize + 6, y + 12);
    y += qrSize + 6;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(248, 248, 248);
  doc.rect(0, 277, W, 20, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 285);
  doc.text("SpaceFlow · Manage your bookings at spaceflow.local", W - margin, 285, { align: "right" });

  doc.save(`SpaceFlow-Booking-${booking.id.slice(0, 8).toUpperCase()}.pdf`);
}
