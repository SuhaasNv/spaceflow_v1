# SpaceFlow — Engineering Case Study

This is the "why," not the "what" — the README covers features. This doc
covers the decisions, the trade-offs, and the specific problems that came up
building and running SpaceFlow.

## The microservices pivot (and why it's not in this repo)

SpaceFlow was first built as five Spring Boot services — auth, booking,
occupancy, analytics, and ai-engine — each with its own database, wired
together with docker-compose. That version exists in a separate repo
(`spaceflow`) and was never deployed.

The reason: running it locally meant five JVMs plus Postgres, all through
docker-compose, on a laptop that couldn't keep that up without becoming
unusable for anything else. The architecture wasn't wrong for a team with
dedicated infra, or for actual independent scaling needs — analytics and
ai-engine really could scale on their own axes. But for one developer
shipping and iterating solo, the operational cost of five services bought
nothing: there was no scaling need to justify it, and every local change
meant restarting a stack heavy enough to fight the machine it ran on.

This repo (`spaceflow_v1`) is the rebuild: one Node/Express API, one
Postgres database via Prisma, one Vite/React frontend. It's the version
that's actually running in production. Collapsing five services into one
process didn't remove the internal boundaries — routes are still split by
domain (`auth`, `spaces`, `bookings`, `occupancy`, `analytics`, `admin`,
`ai`, `recommendations`) — it just removed the network hop, the five
separate deploy pipelines, and the docker-compose file between them. If a
real scaling need shows up for one specific piece (the AI layer is the
obvious candidate — it's the only one with meaningfully different latency
and cost characteristics), it can be pulled back out.

**Takeaway:** microservices are a cost you pay for a benefit you have to
actually need. Here the cost was concrete (unusable local dev) and the
benefit was hypothetical. Monolith won.

## Hard problems, and how they got found

### The silent-hang bug: async handlers + Express 4

Most routes validate input with Zod's `.parse()`, which throws on bad
input. In an `async` Express 4 route handler with no `try/catch`, that
throw becomes a rejected promise — and Express 4 does not forward a
rejected async handler to the error middleware. The request just hangs
until the client times out. No 400, no log line pointing at it, nothing.

This is easy to miss because it only shows up on the *invalid*-input path;
every happy-path request and every manually-tested error case (where
someone remembered to wrap it in `try/catch`, like `auth.ts` does) works
fine. It surfaced during a security pass, not from a bug report — nobody
had hit it yet, or had and just assumed the request was slow.

Fix: `express-async-errors`, imported once before any router is created.
It patches Express's routing internals to forward a rejected async
handler to `next(err)` automatically, so the existing centralized
`errorHandler` (which already had correct `ZodError` handling written)
actually gets a chance to run.

### CORS that was wider than it looked

The CORS config allowed `FRONTEND_URL` and anything matching
`*.vercel.app`, with `credentials: true`. On its own the wildcard looks
reasonable — Vercel preview URLs are unpredictable. Combined with
credentialed cookies, though, it means *any* app deployed to Vercel's free
tier — not just this project's previews — is a trusted origin. A logged-in
user visiting an unrelated `*.vercel.app` site would have their browser
attach SpaceFlow's session cookies to a request from that site, and CORS
would let the response back through.

Fixed by dropping the wildcard and trusting only the single configured
`FRONTEND_URL`. The lesson: `credentials: true` changes what an origin
check is actually for — it's not "which sites can call this API," it's
"which sites can act as an already-logged-in user."

### Railway's pre-deploy step failing with no diagnosis

The backend's Railway deploy was failing at a `PRE_DEPLOY_COMMAND` stage
with only "Pre-deploy command failed" — no stack trace, no stdout. The
repo has a `prisma/schema.prisma` but no `prisma/migrations/` directory,
because the project has always used `prisma db push` (schema-sync, no
migration history) rather than `prisma migrate`. At some point the
Railway service's pre-deploy command had been set to `prisma migrate
deploy` — which fails immediately and silently-ish when there's no
migrations folder to apply.

Fixed by setting the pre-deploy command to match how the project actually
manages its schema (`prisma db push`), and separately, the linked Postgres
service itself had no active deployment — redeployed that first. Two
independent failures stacked on top of each other, which is why the first
fix attempt (just the pre-deploy command) wouldn't have been enough on its
own; the diagnosis had to check both the app service and its database
before either fix meant anything.

## AI: provider fallback, not a hard dependency

Recommendations and the natural-language booking assistant use Gemini as
the primary provider, OpenAI as a fallback if Gemini fails or isn't
configured, and a rule-based path if neither key is set. The app is fully
usable with zero AI provider configured — bookings, occupancy tracking,
and analytics don't depend on it. AI is additive, not load-bearing, which
matters both for cost control and for not having a third-party outage
take down the core product.

## What's still rough (and why it's not silently hidden)

- **Bundle size.** The main JS chunk is ~1.6MB pre-gzip. It works, but a
  route-level code-split would cut initial load meaningfully. Not done
  yet because it touches routing/lazy-loading and needs to be verified
  across viewports before shipping, not just built.
- **Backend test coverage is new and narrow.** Unit tests currently cover
  pure logic (JWT signing/verification, the timing-safe token compare, the
  `.ics` calendar generator) — not full request/response integration
  tests against a real database, which would need a test Postgres
  instance this environment doesn't have. Real coverage, not full
  coverage.
- **No migration history.** `prisma db push` is fine for a small app
  seeded from scratch, but it means there's no rollback path if a schema
  change goes out wrong. Worth revisiting if this ever needs a real
  release process with multiple environments to promote through.
