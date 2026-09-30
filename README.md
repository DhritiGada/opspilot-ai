# OpsPilot Control

**AI-assisted operations workspace with human-controlled decision making.**

OpsPilot Control is a working product prototype for operational case management. It is designed to help operations teams intake cases, structure messy context, prioritize work, generate AI-assisted recommendations, manage queues, and preserve an auditable record of human decisions.

The product has two distinct experiences:

- **Case Worker Workspace** for reviewing, investigating, and resolving operational cases
- **Admin Workspace** for monitoring workload, AI usage, queue health, exception value, audit activity, and data operations

> **AI can recommend. People own operational decisions.**

## Current product experience

### Case Worker Workspace

The main worker view is **My Case Queue**.

It gives an operator a focused view of day-to-day case work, including:

- My active queue
- High-priority cases
- Cases awaiting AI triage
- Completed cases
- Search across case, customer, and transaction data
- Priority filters
- Owner filters
- AI recommendation-state filters
- Queue sorting
- Case export
- Audit export

The queue is paired with a detailed case workspace so the operator can review the selected record and make a decision without leaving the workflow.

### Create operational case

Workers can create a new operational case directly from the queue.

The intake captures:

- Case title
- Case description
- Customer or account ID
- Transaction ID
- Amount
- Currency
- Processor reference
- Payment status
- Reconciliation status
- Due date

Before creating the case, the operator can choose **Analyze description with AI** to preview AI guidance.

The AI preview can return:

- Classification
- Priority
- Confidence
- Suggested owner
- Summary
- Recommended next action
- Risk signals
- Missing information
- Proposed resolution plan

The worker can review that guidance before the case is created.

If the AI service is unavailable, OpsPilot creates the case without generated AI fields so the case can still enter the operational workflow.

## Human review workflow

OpsPilot separates AI analysis from operational execution.

For an AI-assisted case, the worker can:

1. Review the generated recommendation
2. Inspect confidence, risk signals, and missing information
3. Edit the underlying case record
4. Modify the AI recommendation
5. Add investigation notes or decision rationale
6. Start work
7. Approve or reject the recommendation

AI recommendations never execute financial, access, compliance, customer-impacting, or other consequential operational actions.

This keeps the operator accountable for the final decision while still using AI to accelerate analysis.

## Case lifecycle

Cases support the following workflow states:

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

AI-assisted cases enter **Needs Review**.

Cases created or imported without AI analysis remain untriaged until a user explicitly runs AI triage.

## Admin Workspace

The Admin workspace is centered on an **Operations Overview** dashboard.

### Operational metrics

The current dashboard tracks:

- Active cases
- High-priority cases
- Cases not yet AI triaged
- Active exception value
- AI recommendation acceptance
- Total operational records
- Workload by status
- AI-generated cases
- Reviewed AI cases
- Accepted AI cases
- Cases awaiting AI triage

The goal is to give an operations lead visibility into both human workload and AI-assisted workflow usage.

### AI operations

Admins can run AI triage across eligible active cases that have not yet been analyzed.

The dashboard separately tracks:

- Awaiting AI
- AI generated
- Reviewed AI
- Accepted AI

The product intentionally distinguishes actual model usage from ordinary case processing.

### Queue controls

Admin controls include:

- Assigning unowned cases to an owner or queue
- Archiving completed cases
- Opening the worker queue
- Reviewing recent operational activity
- Opening the full audit history

## Audit history

OpsPilot records meaningful operational activity so the user can reconstruct what happened to a case.

Recorded events include:

- Case creation
- CSV import
- AI triage generation
- AI triage failure
- Case edits
- AI recommendation modification
- Status transitions
- Owner assignment
- Case archival

Audit events preserve:

- Case ID
- Actor
- Timestamp
- Action
- Note
- Tracked field changes when relevant

The **Audit History** view supports both workspace-level review and case-level change history.

## Data Management

The Admin workspace also contains a dedicated **Data Management** area.

### Import cases

Users can import operational records from CSV.

Imported records intentionally remain untriaged until a worker requests AI analysis.

A blank CSV template is available from the interface.

### Export records

Users can export:

- Case records
- Complete audit history

These exports support reporting, reconciliation, testing, and workflow analysis.

### Storage

The current portfolio build stores cases and audit events in browser `localStorage`.

That means:

- Records persist across refreshes in the same browser
- No seeded production data is loaded
- Data remains local to the browser
- Admin users can clear the workspace

All demo data is synthetic.

## AI architecture

Case analysis is handled by the server-side endpoint:

```
POST /api/triage
```

The route uses the **OpenAI Responses API** with strict JSON-schema structured output.

The API key remains server-side.

The structured response requires:

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

The model is instructed to:

- Analyze only the supplied case
- Avoid inventing facts
- Lower confidence when context is ambiguous
- Identify missing information
- Surface relevant operational risks
- Propose a short resolution plan
- Never claim that it executed an operational action

If the AI service is unavailable or unconfigured, OpsPilot does not generate substitute AI fields.

## Operational data model

OpsPilot can track:

- Case ID
- Title
- Description
- Status
- Priority
- Category
- Owner
- Customer ID
- Transaction ID
- Amount
- Currency
- Processor reference
- Payment status
- Reconciliation status
- Due date
- AI state
- AI confidence
- Created timestamp
- Updated timestamp

This lets the product demonstrate a real operational workflow instead of functioning as a standalone AI prompt interface.

## Product principles

### Human controlled

AI provides analysis and recommendations. A person owns the operational decision.

### Explicit AI state

The interface distinguishes between:

- AI-generated recommendations
- Cases that have not been AI triaged

### Auditable decisions

Important case actions and changes are recorded so decisions can be reviewed later.

### Operational continuity

A case can still be created and worked even when AI is unavailable.

### Structured assistance

AI output follows a fixed schema so recommendations can fit into an operational workflow instead of appearing as unstructured chat text.

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

Create a `.env.local` file:

```bash
OPENAI_API_KEY=your_openai_api_key
```

An optional model override can also be provided:

```bash
OPENAI_MODEL=your_model_name
```

If `OPENAI_MODEL` is omitted, the API route uses its configured default model.

Never commit secrets to the repository.

## Product documentation

- [MVP PRD](docs/PRD.md)
- [Product decisions](docs/product-decisions.md)
- [Claude Code guidance](CLAUDE.md)
- [AI build contract](AGENTS.md)

## How the product was built

AI coding tools were used as implementation collaborators while product decisions remained human-owned, including:

- Problem framing
- Workflow design
- Scope and requirements
- UX decisions
- Human-review guardrails
- Data-model decisions
- Acceptance criteria
- Testing decisions
- Release decisions

The project is intended to demonstrate product judgment at the intersection of **AI, operations, workflow design, data, controls, and human oversight**.

## Project status

OpsPilot Control is a portfolio product and working prototype.

It does not claim production usage, customer adoption, or business-impact metrics.
