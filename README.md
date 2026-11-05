# Campus Event Hub

A full stack campus event platform built for the Web Technologies project. Students browse and register for events, organisers create them, administrators approve them, and attendees leave ratings and reviews.

**Stack:** Node.js, Express, EJS, SQLite (`better-sqlite3`), plain CSS. No frontend framework and no external database server, so the project runs offline on any machine with Node.js installed.

## Features

| # | Feature | Role | Description |
|---|---------|------|-------------|
| 1 | Accounts and sessions | Student / Organiser | Register, log in, log out. Passwords hashed with bcrypt, role-based access control. |
| 2 | Event discovery | Everyone | Public list of approved events with keyword search, category filter, date filter and pagination. |
| 3 | Event registration | Student | Register for an event, cancel a registration, capacity limit, duplicate protection, "My events" page. |
| 4 | Organiser event management | Organiser | Create, edit and delete own events. New and edited events return to the approval queue. |
| 5 | Admin moderation | Admin | Approval queue, status changes for every event, user list with account-type management, dashboard counters. |
| 6 | Ratings and reviews | Student | One review per attendee, 1 to 5 rating plus comment, editable, average score shown on the event page. |

## Getting started

Requirements: Node.js 18 or newer.

```bash
cd campus-event-hub
npm install
npm run seed     # creates db/app.db and loads demo data (optional but recommended)
npm start
```

Open http://localhost:3000

Re-running `npm run seed` resets the database to the demo state.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@campus.edu | Admin@123 |
| Organiser | organizer@campus.edu | Organizer@123 |
| Organiser | arts@campus.edu | Organizer@123 |
| Student | student@campus.edu | Student@123 |
| Student | tanvir@campus.edu | Student@123 |

## Project structure

```
campus-event-hub/
├─ server.js                 Express app, session, view locals, error pages
├─ db/
│  ├─ index.js               SQLite connection, schema bootstrap
│  ├─ schema.sql             Tables: users, events, rsvps, reviews
│  └─ seed.js                Demo data
├─ middleware/auth.js        requireLogin and requireRole guards
├─ routes/
│  ├─ auth.js                Feature 1
│  ├─ events.js              Features 2 and 4
│  ├─ rsvp.js                Feature 3
│  ├─ reviews.js             Feature 6
│  └─ admin.js               Feature 5
├─ views/                    EJS templates (partials, auth, events, admin)
└─ public/                   stylesheet and hero illustration
```

## Database

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `users` | Accounts | `email` unique, `password_hash`, `role` |
| `events` | Events | `organizer_id` FK, `status`, `capacity`, `starts_at` |
| `rsvps` | Registrations | unique (`event_id`, `user_id`), `status` going/cancelled |
| `reviews` | Ratings | unique (`event_id`, `user_id`), `rating` 1-5 check |

All queries use parameter binding, and `ON DELETE CASCADE` keeps registrations and reviews tidy. Foreign keys are enabled in `db/index.js`.

## Accessibility

The interface is built against the WCAG 2.1 AA criteria used in the marking rubric:

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `article`, `section`), one `h1` per page, no skipped heading levels, and a skip link.
- Every input has a visible `<label>`; placeholders are hints only. Required fields are marked in text and with `required`.
- Validation errors are explained in words in an error summary and linked to the field, with `aria-invalid` and `aria-describedby`.
- Body text is 16px with 1.6 line height, and colour pairs meet 4.5:1 contrast.
- All actions are reachable by keyboard with a visible focus ring; there are no modal dialogs or keyboard traps.
- Tables use `<caption>` and `scope`; status is written in words, never shown by colour alone.
- Decorative artwork is described with a `<title>` and `<desc>`; event photos use descriptive alt text.

## Division of work

| Member | Features | Main files |
|--------|----------|------------|
| Alden Crasta | 1. Accounts and sessions, 2. Event discovery, 3. Registration and cancellation | `routes/auth.js`, `routes/events.js` (public routes), `routes/rsvp.js`, `views/auth/*`, `views/events/list.ejs`, `views/my-events.ejs` |
| Krish Chauhan | 4. Organiser event management, 5. Admin moderation, 6. Ratings and reviews | `routes/events.js` (organiser routes), `routes/admin.js`, `routes/reviews.js`, `views/events/form.ejs`, `views/events/detail.ejs`, `views/admin/*` |
| Both | Database schema, styling, accessibility review, testing and report | `db/*`, `public/css/style.css`, `views/partials/*` |
