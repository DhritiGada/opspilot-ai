# OpsPilot AI — MVP Product Requirements

## Problem
Operations teams spend significant time reading incoming cases, determining urgency, routing work, and documenting decisions. Pure automation is risky when cases affect customers, money, access, or compliance.

## Product hypothesis
AI can reduce triage effort while preserving accountability if recommendations are structured, confidence-aware, and explicitly reviewed by a human before action.

## Primary user
Operations analyst managing a queue of customer or internal cases.

## MVP workflow
1. Review incoming case queue.
2. Open a case and inspect AI-generated summary, classification, priority, owner, confidence, and next action.
3. Add reviewer context.
4. Approve, modify, or reject the recommendation.
5. Preserve the decision as an auditable event.

## Acceptance criteria
- User can navigate between seeded cases.
- Queue can be searched.
- Each case displays a structured AI recommendation.
- Recommendations expose confidence and a human-review warning.
- User can approve, modify, or reject a recommendation.
- Dashboard metrics react to case state.
- Interface remains usable on tablet/mobile widths.

## Next milestone
Persist cases and audit events, add case creation, connect structured LLM triage, and evaluate recommendations against a labeled test set.

<!-- CI verification touch: workflow corrected after initial bootstrap failure. -->
