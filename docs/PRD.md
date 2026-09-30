# OpsPilot AI — Product Requirements

## Problem
Operations teams spend significant time reading incoming cases, determining urgency, routing work, and documenting decisions. Pure automation is risky when cases affect customers, money, access, or compliance.

## Product hypothesis
AI can reduce triage effort while preserving accountability if recommendations are structured, confidence-aware, and explicitly reviewed by a human before action.

## Primary user
Operations analyst managing a queue of customer or internal cases.

## Current workflow
1. Create or select a synthetic operational case.
2. Inspect a structured triage recommendation.
3. Review summary, classification, priority, owner, confidence, and next action.
4. Add reviewer context.
5. Approve, modify, or reject the recommendation.
6. Preserve the decision as an audit event.
7. Revisit cases and audit history after a browser refresh.

## Acceptance criteria
- User can create a case with a title and description.
- New cases receive a structured recommendation and enter the review queue.
- Demo-generated recommendations are clearly labeled and never represented as external LLM output.
- User can search and navigate the case queue.
- Recommendations expose confidence and a human-review warning.
- User can approve, modify, or reject a recommendation.
- Reviewer notes are captured with the decision.
- Cases and audit events persist in the current browser.
- Audit history displays case, decision, note, and timestamp.
- Dashboard metrics react to case state.
- Interface remains usable on tablet/mobile widths.

## Deliberate constraints
Browser storage is portfolio-demo persistence, not a multi-user production datastore. Demo AI mode is deterministic and credential-free. Consequential actions remain outside the automation boundary.

## Next milestone
Replace Demo AI triage with a server-side structured model call, add schema validation and fallback behavior, and evaluate recommendations against a labeled synthetic test set.
