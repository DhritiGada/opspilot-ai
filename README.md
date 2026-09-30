# OpsPilot AI

**Human-supervised AI for operational case triage.**

OpsPilot AI is a product-builder project exploring how LLMs can accelerate operations work without removing human accountability. Incoming cases are converted into structured recommendations containing a summary, classification, priority, suggested owner, confidence, and next action. A human reviewer can approve, modify, or reject the recommendation before action.

## What you can demo

- Operations command center with queue-level metrics
- Searchable synthetic case queue
- Structured AI recommendation panel
- Confidence and risk-aware review UX
- Approve, modify, and reject workflow
- Reviewer context and visible decision state
- Responsive interface for desktop and smaller screens

## Product principle

> AI recommends. Humans decide.

The product deliberately avoids autonomous consequential actions. This creates an explicit control point for review, overrides, and future audit history.

## Tech stack

Next.js 14, React, TypeScript, CSS, and Lucide icons. The first slice intentionally uses synthetic in-memory cases so the core workflow can be evaluated before adding persistence and external model credentials.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Roadmap

The next milestone adds persistent cases and audit events, case creation, server-side structured LLM triage, recommendation evaluation, and deployment configuration.

## Product documentation

- [MVP PRD](docs/PRD.md)
- [Product decisions](docs/product-decisions.md)
- [Claude Code guidance](CLAUDE.md)
- [AI build contract](AGENTS.md)

## How AI is used in the build

AI coding agents are used as implementation collaborators. Product framing, scope, requirements, UX choices, architecture tradeoffs, acceptance criteria, testing decisions, and release decisions are explicitly documented rather than attributed to the agent.

No production usage or business-impact metrics are claimed for this portfolio project.
