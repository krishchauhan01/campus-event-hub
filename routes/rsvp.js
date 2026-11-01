const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/my-events', requireLogin, (req, res) => {
  const events = db.prepare(`SELECT e.*, u.name AS organizer, r.created_at AS rsvp_at
    FROM rsvps r JOIN events e ON e.id = r.event_id JOIN users u ON u.id = e.organizer_id
    WHERE r.user_id = ? AND r.status = 'going'
    ORDER BY e.starts_at ASC`).all(req.session.user.id);
  res.render('my-events', { title: 'My events', events });
});

router.post('/events/:id/rsvp', requireLogin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event || event.status !== 'approved') {
    req.flash('error', 'That event is not open for registration.');
    return res.redirect('/events');
  }

  const going = db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE event_id = ? AND status = 'going'").get(event.id).c;
  const existing = db.prepare('SELECT * FROM rsvps WHERE event_id = ? AND user_id = ?').get(event.id, req.session.user.id);

  if (existing && existing.status === 'going') {
    req.flash('error', 'You are already registered for this event.');
    return res.redirect('/events/' + event.id);
  }
  if (going >= event.capacity) {
    req.flash('error', 'Sorry, this event is full. You can check back later in case a place frees up.');
    return res.redirect('/events/' + event.id);
  }

  if (existing) {
    db.prepare("UPDATE rsvps SET status = 'going', created_at = datetime('now') WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO rsvps (event_id, user_id, status) VALUES (?,?, 'going')").run(event.id, req.session.user.id);
  }

  req.flash('success', `You are registered for ${event.title}. It now appears under My events.`);
  res.redirect('/events/' + event.id);
});

router.post('/events/:id/rsvp/cancel', requireLogin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).render('404', { title: 'Event not found' });

  const existing = db.prepare('SELECT * FROM rsvps WHERE event_id = ? AND user_id = ?').get(event.id, req.session.user.id);
  if (!existing || existing.status !== 'going') {
    req.flash('error', 'You are not registered for that event.');
    return res.redirect('/events/' + event.id);
  }

  db.prepare("UPDATE rsvps SET status = 'cancelled' WHERE id = ?").run(existing.id);
  req.flash('success', 'Your registration has been cancelled.');
  res.redirect('/events/' + event.id);
});

module.exports = router;
