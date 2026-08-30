// Runs before any test file's imports evaluate. Some modules (e.g. lib/jwt.ts)
// throw at import time if these are missing, so they must be set here first.
process.env.JWT_SECRET ??= "test-jwt-secret-do-not-use-in-production";
process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret-do-not-use-in-production";
