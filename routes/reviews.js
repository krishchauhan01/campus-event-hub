const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.post('/events/:id/reviews', requireLogin, (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ? AND status = 'approved'").get(req.params.id);
  if (!event) return res.status(404).render('404', { title: 'Event not found' });

  const attending = db.prepare("SELECT id FROM rsvps WHERE event_id = ? AND user_id = ? AND status = 'going'")
    .get(event.id, req.session.user.id);
  if (!attending) {
    req.flash('error', 'Only students registered for an event can review it.');
    return res.redirect('/events/' + event.id);
  }

  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').trim().slice(0, 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    req.flash('error', 'Choose a rating between 1 and 5 stars.');
    return res.redirect('/events/' + event.id);
  }
  if (comment.length > 0 && comment.length < 5) {
    req.flash('error', 'If you add a comment, please write at least 5 characters.');
    return res.redirect('/events/' + event.id);
  }

  db.prepare(`INSERT INTO reviews (event_id, user_id, rating, comment) VALUES (?,?,?,?)
    ON CONFLICT(event_id, user_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment`)
    .run(event.id, req.session.user.id, rating, comment);

  req.flash('success', 'Thanks, your review has been saved.');
  res.redirect('/events/' + event.id);
});

module.exports = router;
