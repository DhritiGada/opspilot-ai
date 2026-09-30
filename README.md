# OpsPilot Control

AI-assisted operations workspace for case triage, queue management, human review, and auditable decision-making.

**Live demo:** https://opspilot-ai-six.vercel.app

## What it does

OpsPilot helps operations teams turn messy case context into structured work. Users can create or import cases, run AI-assisted triage, review recommendations, manage ownership and status, and preserve a clear audit trail of human decisions.

The product includes two experiences:

- **Case Worker Workspace** for reviewing, investigating, and resolving cases
- **Admin Workspace** for monitoring workload, AI usage, queue health, exception value, and audit activity

AI can recommend. People make the final operational decision.

## Core features

- Operational case intake and CSV import
- Searchable case queue with priority, owner, and AI-state filters
- AI-assisted classification, priority, confidence, summary, owner suggestion, risk signals, missing information, and next actions
- Human approval, rejection, editing, and investigation notes
- Status and ownership management
- Admin operations dashboard
- Audit history with tracked case changes
- Case and audit exports
- Graceful operation when AI is unavailable

## Tech stack

- Next.js 14
- React 18
- TypeScript
- OpenAI Responses API
- Structured JSON-schema output
- Lucide React
- Browser localStorage
- Vercel

## AI workflow

```
Case context
   ↓
POST /api/triage
   ↓
OpenAI Responses API
   ↓
Structured recommendation
   ↓
Human review
   ↓
Approve / Reject / Modify / Resolve
   ↓
Audit history
```

The AI analyzes only the supplied case and does not execute financial, compliance, access, customer-impacting, or other consequential actions.

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Then open:

```
http://localhost:3000
```

## Product documentation

Detailed product requirements, workflows, guardrails, data model, and acceptance criteria are documented here:

- [MVP PRD](docs/PRD.md)
- [Product decisions](docs/product-decisions.md)

## Status

OpsPilot Control is a working portfolio prototype built to demonstrate product thinking across AI, operations, workflow design, data, controls, and human oversight.

All demo data is synthetic.
