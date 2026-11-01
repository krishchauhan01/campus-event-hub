const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  const stats = {
    pending: db.prepare("SELECT COUNT(*) AS c FROM events WHERE status = 'pending'").get().c,
    approved: db.prepare("SELECT COUNT(*) AS c FROM events WHERE status = 'approved'").get().c,
    users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
    rsvps: db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE status = 'going'").get().c,
  };
  const pending = db.prepare(`SELECT e.*, u.name AS organizer FROM events e
    JOIN users u ON u.id = e.organizer_id WHERE e.status = 'pending' ORDER BY e.created_at ASC`).all();
  res.render('admin/dashboard', { title: 'Admin dashboard', stats, pending });
});

router.post('/events/:id/status', (req, res) => {
  const status = req.body.status;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    req.flash('error', 'Unknown event status.');
    return res.redirect('/admin');
  }
  const info = db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, req.params.id);
  req.flash(info.changes ? 'success' : 'error', info.changes ? `Event ${status}.` : 'Event not found.');
  res.redirect(req.body.returnTo === '/admin/events' ? '/admin/events' : '/admin');
});

router.get('/events', (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'all';
  const where = status === 'all' ? '' : 'WHERE e.status = ?';
  const params = status === 'all' ? [] : [status];
  const events = db.prepare(`SELECT e.*, u.name AS organizer FROM events e
    JOIN users u ON u.id = e.organizer_id ${where} ORDER BY e.created_at DESC`).all(...params);
  res.render('admin/events', { title: 'All events', events, status });
});

router.get('/users', (req, res) => {
  const users = db.prepare(`SELECT u.*,
    (SELECT COUNT(*) FROM events e WHERE e.organizer_id = u.id) AS event_count,
    (SELECT COUNT(*) FROM rsvps r WHERE r.user_id = u.id AND r.status = 'going') AS rsvp_count
    FROM users u ORDER BY u.name ASC`).all();
  res.render('admin/users', { title: 'Manage users', users });
});

router.post('/users/:id/role', (req, res) => {
  const role = req.body.role;
  if (!['student', 'organizer', 'admin'].includes(role)) {
    req.flash('error', 'Unknown role.');
    return res.redirect('/admin/users');
  }
  const info = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (Number(req.params.id) === req.session.user.id) {
    req.session.user.role = role;
  }
  req.flash(info.changes ? 'success' : 'error', info.changes ? 'Role updated.' : 'User not found.');
  res.redirect('/admin/users');
});

module.exports = router;
