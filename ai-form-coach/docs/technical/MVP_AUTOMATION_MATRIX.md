# MVP Automation Matrix

Updated: March 7, 2026

## Iteration Loop

1. Premium but truthful UI
   - Homepage keeps the visual polish.
   - Copy must stay aligned with the public beta surface.

2. Coach runtime reliability
   - Camera surface must show a loading state before the overlay is ready.
   - Pose overlay must mount once a live video element is attached.

3. Beta guardrails
   - Nutrition and plan-generation endpoints must return beta-disabled responses.
   - Non-MVP routes stay hidden or redirected.

4. Release verification
   - `npm run test:automation`
   - `npm run lint`
   - `npm run build`

## Covered By Automation

- Homepage truth and premium beta messaging
- Coach camera readiness and pose overlay mount behavior
- Beta-disabled API responses
- Feature registry, public history filtering, and fitness skeleton contracts
