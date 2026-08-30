import { describe, it, expect } from "vitest";
import { safeTokenEquals } from "./seed.js";

describe("safeTokenEquals", () => {
  it("returns true for identical strings", () => {
    expect(safeTokenEquals("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(safeTokenEquals("abc123", "abc124")).toBe(false);
  });

  it("returns false for different-length strings without throwing", () => {
    expect(safeTokenEquals("short", "a-much-longer-token")).toBe(false);
  });

  it("returns false for an empty candidate", () => {
    expect(safeTokenEquals("", "abc123")).toBe(false);
  });
});
