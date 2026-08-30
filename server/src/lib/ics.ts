/** Minimal RFC 5545 (iCalendar) generator — just enough for a single-event booking export. */

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Escape text per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline). */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface BookingICSInput {
  id: string;
  startTime: Date;
  endTime: Date;
  purpose?: string | null;
  spaceName: string;
  location?: string | null;
}

/** Build a one-event .ics calendar file for a single booking. */
export function buildBookingICS(booking: BookingICSInput): string {
  const summary = escapeText(booking.purpose?.trim() || `Booking: ${booking.spaceName}`);
  const location = escapeText(booking.location ?? booking.spaceName);
  const now = formatICSDate(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SpaceFlow//Booking Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@spaceflow`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(booking.startTime)}`,
    `DTEND:${formatICSDate(booking.endTime)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
