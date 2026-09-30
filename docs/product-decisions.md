# Product Decisions

## 001 — AI recommends; humans decide
**Decision:** The MVP never executes a consequential operational action directly from an LLM recommendation.

**Why:** Classification and summarization can accelerate triage, but confidence is not correctness. A reviewer must be able to inspect, override, and document the decision.

## 002 — Structured recommendation over chatbot-first UX
**Decision:** Present summary, category, priority, owner, confidence, and next action as structured fields.

**Why:** Operations work benefits from scannability, consistency, auditability, and measurable recommendation quality.

## 003 — Demo data before external integrations
**Decision:** The first deployable slice uses realistic synthetic cases.

**Why:** It lets the workflow be tested without exposing customer data or requiring third-party credentials. Real persistence and model calls are the next milestone.
