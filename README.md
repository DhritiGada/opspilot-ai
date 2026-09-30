# OpsPilot AI

**Human-controlled AI for operational case management.**

OpsPilot AI is a product-builder project that explores how AI can help operations teams triage, investigate, prioritize, and resolve cases while keeping consequential decisions with people.

The product combines an AI-assisted **Case Worker workspace** with an **Admin operations dashboard**, structured case data, queue controls, audit history, and data-management tools. AI generates recommendations and supporting context, but it does not execute operational actions.

> **AI recommends. People decide.**

## What OpsPilot does

A case can begin as a manually created record or an imported operational record. OpsPilot can analyze the case through a server-side AI endpoint and return a structured recommendation containing:

- Classification
- Priority
- Confidence
- Concise case summary
- Suggested owner
- Recommended next action
- Risk signals
- Missing information
- Proposed resolution plan

A human reviewer can then investigate the case, edit the underlying record, modify the AI recommendation, start work, approve it, or reject it. Each meaningful action is written to the case audit history.

## Product experience

### Case Worker workspace

The worker experience is designed around day-to-day operational case handling.

Workers can:

- Create operational cases
- Capture customer, transaction, amount, currency, processor, payment, reconciliation, and due-date context
- Preview AI analysis before creating a case
- Run AI triage on an existing untriaged case
- Review confidence, classification, priority, owner, next action, risks, missing information, and resolution steps
- Modify AI-generated recommendations before making a decision
- Edit the underlying case record
- Add investigation notes and decision rationale
- Move cases into active work
- Approve or reject recommendations
- Search the queue by case, customer, transaction, or case content
- Filter by priority, owner, and AI state
- Sort by priority, due date, or recent activity
- Export case and audit data

### Admin workspace

The admin experience provides an operational view across the workspace.

The dashboard surfaces:

- Active case volume
- High-priority cases
- Cases awaiting AI triage
- Total active exception value
- AI recommendation acceptance rate
- Workload by case status
- AI-generated, reviewed, accepted, and awaiting-triage volumes
- Recent operational activity

Admin controls include:

- Bulk AI triage for active untriaged cases
- Bulk assignment of unowned cases
- Bulk archival of completed cases
- Access to the complete audit history
- CSV case import
- Case-data export
- Audit-log export
- Workspace data controls

## Case lifecycle

Cases support the following states:

```
New
  ↓
Needs Review
  ↓
In Progress
  ↓
Approved / Rejected / Resolved
  ↓
Archived
```

AI-assisted cases enter **Needs Review**. Cases created or imported without AI analysis remain untriaged until a user explicitly requests AI assistance.

## Human-in-the-loop design

OpsPilot deliberately separates **recommendation** from **execution**.

The AI can propose what an operator should investigate or do next, but it cannot autonomously execute financial, access, compliance, customer-impacting, or other operational actions.

The interface reinforces this boundary by allowing users to:

1. Inspect the AI recommendation and its confidence.
2. Review risk signals and missing information.
3. Modify the recommendation.
4. Add human context and rationale.
5. Approve, reject, or continue investigation themselves.

This makes confidence a review signal, not proof of correctness.

## AI architecture

Case analysis is performed through the server-side:

```
POST /api/triage
```

The route uses the **OpenAI Responses API** with strict structured output. The API key stays server-side.

The current schema requires:

```
category
priority
confidence
summary
action
owner
riskSignals
missingInformation
resolutionPlan
```

The AI is explicitly instructed to analyze only the supplied case, avoid inventing facts, lower confidence when information is ambiguous, and never claim that it executed an operational action.

If the AI service is unavailable or is not configured, OpsPilot does **not** generate substitute AI fields. The case can still be created without a recommendation and triaged later.

## Operational data model

In addition to the core case title and description, OpsPilot can track operational context such as:

- Customer ID
- Transaction ID
- Amount
- Currency
- Processor reference
- Payment status
- Reconciliation status
- Due date
- Owner
- Category
- Priority
- AI state and confidence
- Created and updated timestamps

This makes the demo closer to a real operations workflow than a standalone AI prompt interface.

## Auditability

OpsPilot records operational events such as:

- Case creation
- CSV import
- AI triage generation
- Failed AI triage attempts
- Case edits
- AI recommendation modifications
- Status transitions
- Owner assignment
- Case archival

Audit events include the case ID, actor, timestamp, note, and tracked field changes where relevant.

Users can inspect the full audit stream or open the history for an individual case.

## Data management

The Admin workspace includes CSV-based import and export workflows.

### Import

Operational records can be imported from CSV. Imported cases begin without AI-generated fields so that model analysis remains an explicit user action.

### Export

Users can export:

- Case records
- Complete audit history

These exports make the prototype useful for demonstrating reporting, reconciliation, and operational-governance workflows.

## Persistence

This portfolio build uses browser `localStorage` for case and audit persistence.

That means:

- Records survive page refreshes in the same browser.
- No seeded production records are loaded.
- Workspace data is local to the browser.
- Admin users can clear the local workspace.

All demo data is synthetic.

## Tech stack

- **Next.js 14**
- **React 18**
- **TypeScript**
- **OpenAI Responses API**
- **Strict JSON-schema structured output**
- **Lucide React**
- **Browser localStorage**
- **Vercel**

## Run locally

```bash
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

Create a `.env.local` file and add:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Optionally specify a model:

```bash
OPENAI_MODEL=your_model_name
```

If `OPENAI_MODEL` is omitted, the API route uses its configured default model.

Never commit API keys or other secrets to the repository.

## Product documentation

- [MVP PRD](docs/PRD.md)
- [Product decisions](docs/product-decisions.md)
- [Claude Code guidance](CLAUDE.md)
- [AI build contract](AGENTS.md)

## Product-building approach

AI coding tools were used as implementation collaborators while product decisions remained human-owned, including:

- Problem framing
- Workflow design
- Scope and requirements
- UX decisions
- Human-review guardrails
- Data model choices
- Acceptance criteria
- Testing decisions
- Release decisions

The project is intended to demonstrate product judgment at the intersection of **AI, operations, workflow design, data, and human oversight**.

## Project status

OpsPilot AI is a portfolio product and working prototype. It does not claim production usage, customer adoption, or business-impact metrics.
