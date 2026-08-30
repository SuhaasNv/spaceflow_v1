import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./jwt.js";

describe("jwt", () => {
  it("signs and verifies an access token round-trip", () => {
    const token = signAccessToken({ userId: "user-1", role: "EMPLOYEE" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("user-1");
    expect(payload.role).toBe("EMPLOYEE");
  });

  it("signs and verifies a refresh token round-trip", () => {
    const token = signRefreshToken("user-2");
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe("user-2");
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ userId: "user-3", role: "ADMIN" });
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("does not verify an access token as a refresh token", () => {
    const accessToken = signAccessToken({ userId: "user-4", role: "EMPLOYEE" });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
