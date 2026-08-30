import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Role } from "@prisma/client";

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    "JWT_SECRET and JWT_REFRESH_SECRET must be set — refusing to start without them."
  );
}

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): string {
  // jwt.sign's `iat` has 1-second granularity, so two refresh tokens signed for
  // the same user within the same second are byte-identical — and RefreshToken.token
  // is unique in the DB, so the second insert fails. `jti` guarantees uniqueness
  // regardless of timing (e.g. two concurrent logins for the same account).
  return jwt.sign({ userId, jti: randomUUID() }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}

export const REFRESH_EXPIRY_DATE = () =>
  new Date(Date.now() + REFRESH_EXPIRY_MS);
