import { describe, it, expect } from "vitest";
import { buildBookingICS } from "./ics.js";

describe("buildBookingICS", () => {
  const base = {
    id: "booking-123",
    startTime: new Date("2026-09-01T09:00:00.000Z"),
    endTime: new Date("2026-09-01T10:00:00.000Z"),
    spaceName: "Meeting Room A",
  };

  it("produces a valid single-event VCALENDAR block", () => {
    const ics = buildBookingICS(base);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:booking-123@spaceflow");
    expect(ics).toContain("DTSTART:20260901T090000Z");
    expect(ics).toContain("DTEND:20260901T100000Z");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("uses the space name as summary when no purpose is set", () => {
    const ics = buildBookingICS(base);
    expect(ics).toContain("SUMMARY:Booking: Meeting Room A");
  });

  it("uses purpose as summary when set", () => {
    const ics = buildBookingICS({ ...base, purpose: "Sprint planning" });
    expect(ics).toContain("SUMMARY:Sprint planning");
  });

  it("escapes commas, semicolons, and newlines per RFC 5545", () => {
    const ics = buildBookingICS({ ...base, purpose: "Team sync; roadmap, Q4\nfollow-up" });
    expect(ics).toContain("SUMMARY:Team sync\\; roadmap\\, Q4\\nfollow-up");
  });

  it("uses CRLF line endings", () => {
    const ics = buildBookingICS(base);
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.split("\n").every((line) => line === "" || line.endsWith("\r"))).toBe(true);
  });
});
