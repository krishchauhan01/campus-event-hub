const express = require('express');
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();
const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Social', 'Career', 'Other'];
const PER_PAGE = 6;

const EVENT_SELECT = `SELECT e.*, u.name AS organizer,
  (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS going,
  (SELECT ROUND(AVG(rv.rating), 1) FROM reviews rv WHERE rv.event_id = e.id) AS rating
  FROM events e JOIN users u ON u.id = e.organizer_id`;

function validateEvent(body) {
  const values = {
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    category: body.category || '',
    location: (body.location || '').trim(),
    starts_at: (body.starts_at || '').trim(),
    ends_at: (body.ends_at || '').trim(),
    capacity: (body.capacity || '').trim(),
    image_url: (body.image_url || '').trim()
  };
  const errors = [];
  if (values.title.length < 3 || values.title.length > 120) errors.push('Title must be between 3 and 120 characters.');
  if (values.description.length < 20) errors.push('Description must be at least 20 characters, so students know what to expect.');
  if (!CATEGORIES.includes(values.category)) errors.push('Choose a category from the list.');
  if (values.location.length < 3) errors.push('Enter the room or place where the event happens.');
  if (!values.starts_at || Number.isNaN(Date.parse(values.starts_at))) errors.push('Enter a valid start date and time.');
  if (values.ends_at && (Number.isNaN(Date.parse(values.ends_at)) || Date.parse(values.ends_at) <= Date.parse(values.starts_at))) {
    errors.push('The end time must be later than the start time.');
  }
  const capacity = Number(values.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) errors.push('Capacity must be a whole number between 1 and 500.');
  if (values.image_url && !/^https?:\/\//.test(values.image_url)) errors.push('Image link must start with http:// or https://, or leave it empty.');
  return { values, errors, capacity };
}

function ownEvent(req, res, next) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).render('404', { title: 'Event not found' });
  if (req.session.user.role !== 'admin' && event.organizer_id !== req.session.user.id) {
    return res.status(403).render('403', { title: 'Not allowed' });
  }
  res.locals.event = event;
  next();
}

/* ---------- Public: home and event discovery ---------- */

router.get('/', (req, res) => {
  const events = db.prepare(`${EVENT_SELECT}
    WHERE e.status = 'approved' AND date(e.starts_at) >= date('now')
    ORDER BY e.starts_at ASC LIMIT 3`).all();
  res.render('index', { title: 'Upcoming events', events, categories: CATEGORIES });
});

router.get('/events', (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 100);
  const category = CATEGORIES.includes(req.query.category) ? req.query.category : '';
  const when = ['upcoming', 'past', 'all'].includes(req.query.when) ? req.query.when : 'upcoming';
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const where = ["e.status = 'approved'"];
  const params = [];
  if (q) {
    where.push('(e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    where.push('e.category = ?');
    params.push(category);
  }
  if (when === 'upcoming') where.push("date(e.starts_at) >= date('now')");
  if (when === 'past') where.push("date(e.starts_at) < date('now')");

  const clause = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS c FROM events e WHERE ${clause}`).get(...params).c;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, pages);
  const events = db.prepare(`${EVENT_SELECT} WHERE ${clause} ORDER BY e.starts_at ASC LIMIT ? OFFSET ?`)
    .all(...params, PER_PAGE, (safePage - 1) * PER_PAGE);

  res.render('events/list', {
    title: 'All events', events, categories: CATEGORIES, q, category, when,
    page: safePage, pages, total
  });
});

router.get('/events/:id', (req, res, next) => {
  const event = db.prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(req.params.id);
  if (!event) return next();

  const reviews = db.prepare(`SELECT r.*, u.name AS author FROM reviews r
    JOIN users u ON u.id = r.user_id WHERE r.event_id = ? ORDER BY r.created_at DESC`).all(event.id);
  const summary = db.prepare('SELECT ROUND(AVG(rating),1) AS avg, COUNT(*) AS count FROM reviews WHERE event_id = ?').get(event.id);
  const mine = req.session.user
    ? db.prepare("SELECT id FROM rsvps WHERE event_id = ? AND user_id = ? AND status = 'going'").get(event.id, req.session.user.id)
    : null;
  const myReview = req.session.user
    ? db.prepare('SELECT * FROM reviews WHERE event_id = ? AND user_id = ?').get(event.id, req.session.user.id)
    : null;

  res.render('events/detail', {
    title: event.title, event, reviews, summary, mine: Boolean(mine), myReview: myReview || null
  });
});

/* ---------- Organizer: create, edit, delete own events ---------- */

router.get('/organizer/events', requireRole('organizer', 'admin'), (req, res) => {
  const events = db.prepare(`${EVENT_SELECT} WHERE e.organizer_id = ? ORDER BY e.starts_at DESC`)
    .all(req.session.user.id);
  res.render('events/organizer-list', { title: 'My events', events });
});

router.get('/organizer/events/new', requireRole('organizer', 'admin'), (req, res) => {
  res.render('events/form', {
    title: 'Create an event',
    mode: 'create',
    action: '/organizer/events',
    categories: CATEGORIES,
    values: { title: '', description: '', category: '', location: '', starts_at: '', ends_at: '', capacity: '50', image_url: '' },
    errors: []
  });
});

router.post('/organizer/events', requireRole('organizer', 'admin'), (req, res) => {
  const { values, errors, capacity } = validateEvent(req.body);
  if (errors.length) {
    return res.status(400).render('events/form', {
      title: 'Create an event', mode: 'create', action: '/organizer/events', categories: CATEGORIES, values, errors
    });
  }
  const info = db.prepare(`INSERT INTO events
    (title, description, category, location, starts_at, ends_at, capacity, image_url, organizer_id, status)
    VALUES (?,?,?,?,?,?,?,?,?,'pending')`)
    .run(values.title, values.description, values.category, values.location, values.starts_at,
      values.ends_at || null, capacity, values.image_url || null, req.session.user.id);

  req.flash('success', 'Event submitted. An administrator will review it before it appears on the public list.');
  res.redirect('/organizer/events');
});

router.get('/organizer/events/:id/edit', requireRole('organizer', 'admin'), ownEvent, (req, res) => {
  res.render('events/form', {
    title: 'Edit event',
    mode: 'edit',
    action: `/organizer/events/${res.locals.event.id}`,
    categories: CATEGORIES,
    values: res.locals.event,
    errors: []
  });
});

router.post('/organizer/events/:id', requireRole('organizer', 'admin'), ownEvent, (req, res) => {
  const { values, errors, capacity } = validateEvent(req.body);
  if (errors.length) {
    return res.status(400).render('events/form', {
      title: 'Edit event',
      mode: 'edit',
      action: `/organizer/events/${res.locals.event.id}`,
      categories: CATEGORIES,
      values: { ...values, id: res.locals.event.id },
      errors
    });
  }
  db.prepare(`UPDATE events SET title=?, description=?, category=?, location=?, starts_at=?,
      ends_at=?, capacity=?, image_url=?, status='pending' WHERE id=?`)
    .run(values.title, values.description, values.category, values.location, values.starts_at,
      values.ends_at || null, capacity, values.image_url || null, res.locals.event.id);

  req.flash('success', 'Event updated and sent back for approval.');
  res.redirect('/organizer/events');
});

router.post('/organizer/events/:id/delete', requireRole('organizer', 'admin'), ownEvent, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(res.locals.event.id);
  req.flash('success', 'Event deleted.');
  res.redirect('/organizer/events');
});

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;
