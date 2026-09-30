# OpsPilot AI

**Human-supervised AI for operational case triage.**

OpsPilot AI is a product-builder project exploring how AI can accelerate operations work without removing human accountability. Incoming cases become structured recommendations containing a summary, classification, priority, suggested owner, confidence, and next action. A human reviewer can approve, modify, or reject the recommendation before action.

## Live product workflow

- Create a synthetic operational case from the command center
- Generate a structured triage recommendation in transparent **Demo AI mode**
- Review classification, priority, owner, confidence, summary, and next action
- Approve, modify, or reject the recommendation with reviewer context
- Preserve cases and audit events in browser storage across refreshes
- Inspect a dedicated audit-history view
- Search the case queue and monitor reactive queue metrics

## Product principle

> AI recommends. Humans decide.

The product deliberately avoids autonomous consequential actions. Confidence is treated as a review signal, not proof of correctness.

## Current AI boundary

The public demo currently uses deterministic local triage so it remains functional without exposing API credentials or pretending a model call occurred. The UI labels this explicitly as **Demo AI mode**. The next model-integration milestone will put provider logic behind a server-side endpoint while preserving the same human-review contract.

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
