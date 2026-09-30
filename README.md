# OpsPilot AI

**Human-supervised AI for operational case triage.**

[Live Prototype](opspilot-ai-six.vercel.app)

OpsPilot AI is a product-builder project exploring how AI can accelerate operations work without removing human accountability. Incoming cases become structured recommendations containing a summary, classification, priority, suggested owner, confidence, and next action. A human reviewer can approve, modify, or reject the recommendation before action.

## Live product workflow

- Create a synthetic operational case from the command center
- Request a structured triage recommendation from a server-side AI endpoint, with a transparent deterministic fallback
- Review classification, priority, owner, confidence, summary, and next action
- Approve, modify, or reject the recommendation with reviewer context
- Preserve cases and audit events in browser storage across refreshes
- Inspect a dedicated audit-history view
- Search the case queue and monitor reactive queue metrics

## Product principle

> AI recommends. Humans decide.

The product deliberately avoids autonomous consequential actions. Confidence is treated as a review signal, not proof of correctness.

## Current AI boundary

New case intake calls a server-side `/api/triage` endpoint backed by the OpenAI Responses API and strict structured output. The API key remains server-side. If the AI service is unavailable or unconfigured, OpsPilot falls back to deterministic triage and labels that result as Demo AI. The human-review contract is unchanged. Environment Set `OPENAI_API_KEY` in the server/deployment environment. `OPENAI_MODEL` is optional; the route has a default model. Never commit secrets to the repository.

## Tech stack

Next.js 14, React, TypeScript, CSS, Lucide icons, and browser localStorage for portfolio-demo persistence. All included cases are synthetic.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product documentation

- [MVP PRD](docs/PRD.md)
- [Product decisions](docs/product-decisions.md)
- [Claude Code guidance](CLAUDE.md)
- [AI build contract](AGENTS.md)

## How AI is used in the build

AI coding agents are implementation collaborators. Product framing, scope, requirements, UX choices, architecture tradeoffs, acceptance criteria, testing decisions, and release decisions remain human-owned.

No production usage or business-impact metrics are claimed for this portfolio project.
