# AI Prompt Log

This log summarizes the requests used to shape the lab reservation prototype. It records request topics rather than implementation details.

| # | Request summary | Result |
| ---: | --- | --- |
| 1 | Create a basic HTML, CSS, and JavaScript structure for the Institute of Computing's three labs and the teacher booking scenario. | Added the page structure, responsive styling, and an initial browser-based booking flow. The duplicate lab label in the scenario was represented as Comlab 2. |
| 2 | Define the reservation information as ID, teacher, lab, date, start and end time, purpose, student count, and status. | Updated the form and reservation display; generated IDs and enforced lab capacities. |
| 3 | Start requests as Pending; prevent overlaps with Pending or Approved reservations; support coordinator approval/rejection with a reason; allow teacher cancellation; add a lab/date schedule, filters, and status totals. | Added the status workflow, conflict checks, rejection reasons, cancellation, schedule, filters, and dashboard. |
| 4 | Improve the design while retaining the same background and format. | Refined spacing, hierarchy, status colors, cards, and mobile behavior while preserving the visual theme. |
| 5 | Refactor JavaScript to reduce repetition without changing functionality and explain the changes. | Added shared DOM and persistence helpers and reduced repeated dashboard counting. |
| 6 | Add `README.md`, `docs/requirements-analysis.md`, and `docs/ai-prompt-log.md`. | Documented project setup, scope, functional and business rules, status transitions, limitations, and prompt summaries. |

## Note

The prompt log is a concise summary of requests made during development, not a verbatim transcript.
