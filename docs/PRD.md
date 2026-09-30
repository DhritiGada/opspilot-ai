# OpsPilot Control — MVP Product Requirements Document

## 1. Product summary

OpsPilot Control is an AI-assisted operations workspace for managing operational cases from intake through review and resolution.

The MVP is designed around a simple principle:

> **AI can recommend. People own operational decisions.**

The product helps operations teams structure case context, prioritize work, generate AI-assisted recommendations, manage queues, and preserve an auditable record of human decisions without allowing the model to execute consequential operational actions.

The current MVP includes two experiences:

- **Case Worker Workspace** for case intake, investigation, AI-assisted review, and decision making
- **Admin Workspace** for workload monitoring, AI-usage visibility, queue controls, audit review, and data management

All demo data is synthetic.

---

## 2. Problem

Operations teams often work from fragmented case descriptions, transaction details, customer context, and manual notes.

Before action can be taken, an operator may need to:

- understand what happened
- determine urgency
- identify missing information
- classify the issue
- route the case
- assess operational risk
- decide what to investigate next
- document why a decision was made
- maintain a traceable record for later review

This creates repetitive triage work and inconsistent decision documentation.

Pure automation is not appropriate when cases can affect money, customers, access, compliance, or other consequential outcomes.

The product opportunity is to use AI for **structured analysis and recommendation generation** while keeping operational judgment and execution with a human reviewer.

---

## 3. Product hypothesis

If operations teams receive structured, confidence-aware AI recommendations directly inside their case workflow, they can review cases more efficiently while preserving accountability.

This hypothesis depends on four design requirements:

1. AI output must be structured and operationally useful.
2. AI-generated fields must be distinguishable from human-entered data.
3. A human must remain responsible for the decision.
4. Important changes and decisions must be auditable.

---

## 4. MVP goals

The MVP should demonstrate that a lightweight operations workspace can:

- intake structured operational cases
- use AI to analyze case descriptions
- generate consistent recommendations
- surface risk signals and missing information
- allow human modification and override
- support queue-based case work
- provide manager-level workload visibility
- preserve case and audit history
- import and export operational records
- continue functioning when AI is unavailable

The MVP is intended to demonstrate product thinking across AI, workflow design, operations, data, controls, and human oversight.

---

## 5. Non-goals

The MVP does not:

- execute payments, refunds, account changes, access changes, or other consequential actions
- autonomously close or resolve operational cases
- replace a human reviewer
- connect to production customer systems
- provide enterprise authentication or role-based access control
- use a production database
- claim production usage, customer adoption, or business-impact metrics
- use real customer or transaction data

---

## 6. Primary users

### 6.1 Case Worker

A frontline operations user responsible for reviewing, investigating, and progressing operational cases.

Primary needs:

- understand case context quickly
- identify urgent work
- know what information is missing
- receive a structured recommendation
- edit or override AI suggestions
- document rationale
- manage an active queue
- preserve a record of actions taken

### 6.2 Operations Admin

An operations lead or manager responsible for monitoring workload, AI usage, queue health, and operational activity.

Primary needs:

- monitor active workload
- identify high-priority work
- see cases awaiting AI triage
- monitor exception value
- understand AI recommendation usage
- assign unowned work
- triage cases in bulk
- archive completed records
- review audit history
- import and export operational data

---

## 7. Core user experience

## 7.1 Case Worker Workspace

The default worker view is **My Case Queue**.

The workspace must display:

- My active queue
- High-priority count
- Awaiting AI count
- Completed count

The worker must be able to:

- search by case, customer, transaction, and case content
- filter by priority
- filter by owner
- filter by AI recommendation state
- sort by priority, due date, or recently updated
- export case records
- export audit history
- select a case and review its full details

When there are no active cases, the workspace should clearly communicate that the queue is empty and direct the user toward case creation or Admin import.

---

## 7.2 Create operational case

A Case Worker must be able to create a case manually.

The intake form supports:

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

Only the title and description are required for case creation.

The richer operational fields are optional so the product can support both lightweight issue intake and transaction-oriented operational scenarios.

---

## 7.3 AI preview before case creation

Before creating a case, the worker can choose **Analyze description with AI**.

The AI preview must return structured fields:

- Classification
- Priority
- Confidence
- Suggested owner
- Summary
- Recommended next action
- Risk signals
- Missing information
- Proposed resolution plan

The user must be able to review the AI output before creating the case.

If the AI request fails, the product must not fabricate fallback AI fields.

The case must still be creatable without AI-generated content.

---

## 7.4 Existing-case AI triage

Cases created or imported without AI analysis must remain identifiable as **Not AI triaged**.

A worker must be able to explicitly run AI triage on an eligible case later.

Successful AI triage changes the case to an AI-generated state and moves it into **Needs Review**.

Failed AI triage must:

- preserve the existing case
- avoid writing fabricated AI fields
- display an error to the user
- record the failed AI attempt in audit history

---

## 7.5 AI recommendation review

For an AI-assisted case, the detail view must expose:

- confidence
- classification
- suggested owner
- summary
- recommended next action
- risk signals
- missing information
- proposed resolution plan

The interface must also display a visible guardrail explaining that AI recommendations do not execute operational actions.

The worker must be able to:

- modify the AI recommendation
- edit the case itself
- add case notes
- start work
- approve the recommendation
- reject the recommendation

Recommendation modification must be treated as a human change, not silently represented as original model output.

---

## 8. Case lifecycle

Supported case states are:

```
New
Needs Review
In Progress
Modified
Approved
Rejected
Resolved
Archived
```

Typical workflow:

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

Additional behavior:

- A manually created or imported case without AI analysis begins as **New**.
- A case created with AI analysis begins as **Needs Review**.
- A human-modified AI recommendation can enter **Modified**.
- Approved, Rejected, Resolved, and Archived are treated as terminal states for the active queue.
- Archived cases remain part of the historical record.

---

## 9. Admin Workspace

The Admin workspace must provide an **Operations Overview**.

### 9.1 Summary metrics

The dashboard must surface:

- Active cases
- High-priority cases
- Not AI triaged
- Exception value
- AI acceptance

### 9.2 Operational workload

The dashboard must summarize record counts by status, including:

- New
- Needs Review
- In Progress
- Completed

The Admin must be able to open the worker queue from this view.

### 9.3 AI operations visibility

The dashboard must distinguish actual AI usage from ordinary case processing.

It must show:

- AI-generated cases
- Reviewed AI cases
- Accepted AI cases
- Awaiting AI triage

AI acceptance is calculated only from reviewed AI-generated recommendations.

### 9.4 Admin AI control

The Admin can run AI triage across eligible active cases that have not yet been triaged.

The interface must:

- disable the action when there are no eligible cases
- show progress while triage is running
- report success or partial failure
- preserve each case if an individual AI request fails
- record successful AI generation in audit history

### 9.5 Queue controls

The Admin can:

- assign all currently unowned active cases to an owner or queue
- archive completed cases

Admin bulk actions must create audit records for affected cases.

---

## 10. Audit history

Auditability is a core MVP requirement.

The system records events such as:

- Case created
- Case imported
- AI triage generated
- AI triage failed
- Case edited
- AI recommendation modified
- Status changed
- Owner assigned
- Case archived

Each audit event should include:

- Event ID
- Case ID
- Action
- Actor
- Timestamp
- Note
- Field changes when applicable

Users must be able to:

- review the complete workspace audit stream
- open the history for an individual case
- inspect before-and-after values for tracked changes where available

---

## 11. Data Management

The Admin workspace includes a dedicated **Data Management** view.

### 11.1 CSV import

The product must allow CSV case import.

Expected import fields include:

- title
- description
- customer_id
- transaction_id
- amount
- currency
- processor_ref
- payment_status
- reconciliation_status
- due_date

Rules:

- Title and description are required for a row to be accepted.
- Invalid rows are skipped.
- Imported cases begin without AI-generated fields.
- Import results report accepted and rejected row counts.
- Each accepted record generates an audit event.

A downloadable blank CSV template must be available.

### 11.2 Export

Users must be able to export:

- Case records as CSV
- Audit history as CSV

Case exports should include operational and AI-state fields needed for reporting and reconciliation.

Audit exports should include the event, case, actor, timestamp, note, and tracked changes.

### 11.3 Workspace storage controls

The Admin view must display:

- Number of stored case records
- Number of stored audit events

The Admin can clear all locally stored workspace data.

---

## 12. AI architecture

AI triage is handled by:

```
POST /api/triage
```

The server-side route uses the **OpenAI Responses API**.

The API key remains server-side and is never exposed to the browser.

The response uses strict structured output with the following required schema:

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

Priority must resolve to:

- High
- Medium
- Low

Confidence must be an integer from 0 to 100.

The model is instructed to:

- analyze only the supplied case
- avoid claiming facts that are not present
- lower confidence when information is ambiguous
- identify missing information
- surface relevant operational risks
- propose a short resolution plan
- never claim that it executed a financial, access, compliance, or customer-impacting action

---

## 13. Human-control requirements

The MVP must preserve the following boundary:

### AI may

- summarize
- classify
- prioritize
- suggest an owner
- recommend a next action
- identify risks
- identify missing information
- propose resolution steps

### AI may not

- move money
- issue refunds
- modify an account
- change access
- contact a customer autonomously
- execute compliance actions
- approve or reject a case
- claim that a consequential action has already occurred

A person remains responsible for operational decisions.

---

## 14. Operational data model

A case can contain:

- ID
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
- AI mode
- AI confidence
- AI summary
- AI next action
- Risk signals
- Missing information
- Resolution plan
- Created timestamp
- Updated timestamp

---

## 15. Persistence

The current MVP uses browser `localStorage`.

Requirements:

- cases persist across refreshes in the same browser
- audit events persist across refreshes in the same browser
- the app does not load seeded production records
- data remains local to that browser
- the Admin can clear local workspace data

This is sufficient for a portfolio prototype but is not intended to represent a production multi-user datastore.

---

## 16. MVP acceptance criteria

### Case Worker

- User can create a case with title and description.
- User can optionally capture customer, transaction, amount, payment, reconciliation, and due-date information.
- User can preview AI analysis before case creation.
- User can create a case when AI is unavailable.
- User can run AI triage later on an untriaged case.
- AI-generated cases clearly expose confidence and AI state.
- User can review risk signals, missing information, and a resolution plan.
- User can edit the underlying case.
- User can modify the AI recommendation.
- User can add decision or investigation notes.
- User can start work on a case.
- User can approve or reject an AI recommendation.
- User can search, filter, and sort the active queue.
- User can export case and audit data.

### Admin

- Admin can view workload metrics.
- Admin can view high-priority volume.
- Admin can view untriaged case volume.
- Admin can view active exception value.
- Admin can view AI recommendation acceptance.
- Admin can review workload by status.
- Admin can distinguish AI-generated, reviewed, accepted, and awaiting-AI cases.
- Admin can bulk-triage eligible cases.
- Admin can assign unowned active cases.
- Admin can archive completed cases.
- Admin can view recent activity.
- Admin can open full audit history.

### Data Management

- Admin can import cases from CSV.
- Invalid CSV rows do not prevent valid rows from importing.
- Imported cases remain untriaged.
- Admin can download a blank CSV template.
- Admin can export case records.
- Admin can export the audit log.
- Admin can see stored case and audit counts.
- Admin can clear the local workspace.

### Governance

- AI recommendations never directly execute operational actions.
- Failed AI requests never produce fake AI recommendations.
- Important case actions create audit events.
- Human edits to AI recommendations are traceable.
- Browser refresh does not erase locally persisted workspace data.

---

## 17. MVP success signals

Because this is a portfolio prototype, the MVP does not claim real-world business impact.

Useful evaluation signals for future testing include:

- time from intake to first triage decision
- percentage of cases receiving AI analysis
- percentage of AI recommendations reviewed
- recommendation acceptance rate
- modification rate
- rejection rate
- high-priority case identification accuracy
- routing accuracy
- missing-information usefulness
- resolution-plan usefulness
- audit completeness
- operator time saved during triage

These would need to be measured through controlled testing or real product usage before being presented as product outcomes.

---

## 18. Deliberate MVP constraints

The current build intentionally uses:

- synthetic operational data
- browser localStorage
- a lightweight role switch instead of production authentication
- manual human review before decisions
- CSV import/export instead of external system integrations
- a single AI triage endpoint rather than multiple autonomous agents

These constraints keep the prototype focused on the core workflow and product hypothesis.

---

## 19. Next milestone

The next meaningful product milestone is to move from a portfolio prototype toward a testable operational system by adding:

- persistent server-side storage
- authenticated users and role-based permissions
- explicit assignment ownership
- server-side audit persistence
- schema and request validation at the API boundary
- model-evaluation datasets for triage quality
- recommendation-quality instrumentation
- stronger failure and retry handling
- integration points for external case or transaction systems
- controlled testing of triage time, routing accuracy, and recommendation usefulness

The human-control boundary should remain unchanged as the product evolves.
