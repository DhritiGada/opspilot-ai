# Claude Code Guidance — OpsPilot AI

OpsPilot AI is a portfolio-grade operations workflow product, not a chatbot demo.

## Product principles
- AI recommends; humans remain accountable for consequential decisions.
- Expose confidence and rationale/context needed for review.
- Preserve an audit trail for state changes and overrides.
- Use synthetic demo data only.
- Never invent measured business outcomes.

## Engineering priorities
1. Keep the app deployable on Vercel.
2. Prefer typed, testable domain objects.
3. Keep model/provider logic behind a server-side interface.
4. Never expose API keys to the browser.
5. Add persistence before authentication complexity.
