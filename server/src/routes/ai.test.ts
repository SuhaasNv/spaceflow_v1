import { describe, it, expect } from "vitest";
import { wallClockToUtc } from "./ai.js";

describe("wallClockToUtc", () => {
  it("treats offset 0 as UTC (no shift)", () => {
    const d = wallClockToUtc("2026-09-02", "12:30", 0);
    expect(d.toISOString()).toBe("2026-09-02T12:30:00.000Z");
  });

  it("shifts correctly for a positive UTC offset zone (e.g. UTC+8, offset -480)", () => {
    // 12:30 local in UTC+8 is 04:30 UTC the same day.
    const d = wallClockToUtc("2026-09-02", "12:30", -480);
    expect(d.toISOString()).toBe("2026-09-02T04:30:00.000Z");
  });

  it("shifts correctly for a negative UTC offset zone (e.g. UTC-5, offset +300)", () => {
    // 12:30 local in UTC-5 is 17:30 UTC the same day.
    const d = wallClockToUtc("2026-09-02", "12:30", 300);
    expect(d.toISOString()).toBe("2026-09-02T17:30:00.000Z");
  });

  it("rolls over to the next UTC day when the offset pushes past midnight", () => {
    // 23:00 local in UTC-5 is 04:00 UTC the *next* day.
    const d = wallClockToUtc("2026-09-02", "23:00", 300);
    expect(d.toISOString()).toBe("2026-09-03T04:00:00.000Z");
  });

  it("returns an Invalid Date for malformed input instead of throwing", () => {
    expect(Number.isNaN(wallClockToUtc("not-a-date", "12:30", 0).getTime())).toBe(true);
    expect(Number.isNaN(wallClockToUtc("2026-09-02", "not-a-time", 0).getTime())).toBe(true);
  });
});
