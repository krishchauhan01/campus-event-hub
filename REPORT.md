# Report outline — Campus Event Hub

Use this as the skeleton of the submitted report. Replace the placeholders in square brackets, and paste the screenshots listed at the end.

## 1. Introduction

- Project title: Campus Event Hub
- Team: [Member A name, ID] and [Member B name, ID]
- Course: [course code], Web Technologies
- Problem: campus events are announced on notice boards and group chats, so students miss them and organisers cannot track numbers.
- Solution: one web application where students discover and register for events, organisers publish them, and administrators moderate the listings.

## 2. Technology stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | HTML5, semantic markup, CSS, EJS templates | Server-rendered pages are fast and easy to make accessible |
| Backend | Node.js with Express | Small, readable routing layer |
| Database | SQLite via `better-sqlite3` | Real relational database, no separate server to install |
| Security | bcrypt password hashing, session cookies | Passwords are never stored in plain text |

Architecture: browser → Express routes → SQLite; EJS renders the response.

## 3. Database design

List the four tables and include the ER diagram (users 1-many events, users 1-many rsvps, events 1-many rsvps, events 1-many reviews, users 1-many reviews).

Screenshot: schema diagram.

## 4. Feature walkthrough

For each feature: what it does, which files implement it, and a screenshot.

1. **Accounts and sessions** — registration with role choice, login, logout, access guards.
2. **Event discovery** — search, category and date filters, pagination, public detail page.
3. **Event registration** — register, cancel, capacity enforcement, My events page.
4. **Organiser event management** — create, edit, delete; approval queue round trip.
5. **Admin moderation** — pending queue, status changes, user role management, counters.
6. **Ratings and reviews** — one review per attendee, average score, edit own review.

## 5. Accessibility compliance

| Criterion | Implementation |
|-----------|----------------|
| Semantic structure | `header`, `nav`, `main`, `footer`, `article`, ordered headings, skip link |
| Contrast | Palette checked at 4.5:1 or better for body text |
| Text size and spacing | 16px base, 1.6 line height, 70 character line length |
| Images | Hero illustration has `<title>` and `<desc>`; event photos have descriptive alt text |
| Labels | Visible label for every control, placeholders used as hints only |
| Errors | Text error summary plus inline messages, `aria-invalid`, `aria-describedby` |
| Instructions | Required fields marked in text, helper text under each field |
| Keyboard access | Logical tab order, visible focus ring, no dialogs |

## 6. Division of work

| Member | Features | Files |
|--------|----------|-------|
| [Member A] | 1, 2, 3 | `routes/auth.js`, `routes/rsvp.js`, public routes in `routes/events.js`, `views/auth/*`, `views/events/list.ejs`, `views/my-events.ejs` |
| [Member B] | 4, 5, 6 | organiser routes in `routes/events.js`, `routes/admin.js`, `routes/reviews.js`, `views/events/form.ejs`, `views/events/detail.ejs`, `views/admin/*` |
| Both | Database, styling, accessibility review, testing | `db/*`, `public/css/style.css`, `views/partials/*` |

## 7. Testing

Include a table of test cases: valid registration, duplicate email, wrong password, search with no results, registering for a full event, duplicate registration, review without registration, organiser editing another organiser's event, student opening the admin area, invalid event form values.

## 8. Conclusion and GitHub link

Repository: [https://github.com/username/campus-event-hub]

---

## Screenshot checklist

Take these in order at a desktop width around 1280px, then one mobile shot at 375px.

1. Home page with the next three events.
2. Event list with a keyword and category filter applied.
3. Event list showing pagination.
4. Event detail page with places taken and average rating.
5. Registration form with validation errors visible (submit an empty form).
6. Login page.
7. Student "My events" page with two registrations.
8. Event detail showing "You are registered" and the cancellation button.
9. Review form with a rating selected, plus saved review visible.
10. Organiser "My organised events" table with pending and approved rows.
11. Create event form with a validation error.
12. Admin dashboard with the pending queue.
13. Admin all-events table with the status dropdown.
14. Admin users table.
15. Keyboard focus visible on a link or button (press Tab before capturing).
16. Mobile view of the event list.
17. Lighthouse accessibility score (Chrome DevTools → Lighthouse → Accessibility).
