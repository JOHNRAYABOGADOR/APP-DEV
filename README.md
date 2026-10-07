# Institute of Computing Lab Reservation System

A browser-based prototype for managing computer lab reservation requests at the Institute of Computing. Teachers can submit requests and check the schedule; coordinators can review pending requests.

## Available labs

| Lab | Capacity |
| --- | ---: |
| Comlab 1 | 40 students |
| Comlab 2 | 30 students |
| AES | 25 students |

## Features

- Create reservations with a generated reservation ID, teacher, lab, date, time, purpose, and student count.
- Validate seat capacity and prevent overlapping pending or approved reservations in the same lab and date.
- Track Pending, Approved, Rejected, and Cancelled reservations.
- Approve or reject pending requests. A rejection requires a reason.
- Cancel pending or approved requests; cancelled time slots are available again.
- View status totals, filter reservation records, and view a selected lab's schedule ordered by start time.
- Save reservation records in browser local storage.

## Run locally

Open `index.html` in a modern web browser. No package installation or build step is required.

## Prototype limitations

Reservations are stored only in the current browser. They are not synchronized across devices or users. Coordinator actions are not protected by authentication or role-based access. A production system needs a shared backend to enforce permissions and prevent simultaneous conflicting bookings reliably.

## Project files

- `index.html` — page structure and reservation form.
- `style.css` — responsive layout and styling.
- `script.js` — reservation validation, storage, status transitions, filters, dashboard, and schedule.
- [`docs/requirements-analysis.md`](docs/requirements-analysis.md) — project requirements and rules.
- [`docs/ai-prompt-log.md`](docs/ai-prompt-log.md) — summary of AI-assisted development requests.
