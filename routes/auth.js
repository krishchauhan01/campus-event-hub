const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Create an account', values: {}, errors: [] });
});

router.post('/register', (req, res) => {
  const values = req.body;
  const name = (values.name || '').trim();
  const email = (values.email || '').trim().toLowerCase();
  const password = values.password || '';
  const confirm = values.confirm || '';
  const role = values.role || 'student';
  const errors = [];

  if (name.length < 2) errors.push('Enter your full name, at least 2 characters.');
  if (!EMAIL.test(email)) errors.push('Enter a valid email address, for example student@campus.edu.');
  if (password.length < 8) errors.push('Choose a password of at least 8 characters.');
  if (password !== confirm) errors.push('The two passwords do not match.');
  if (!['student', 'organizer'].includes(role)) errors.push('Choose either the student or the organizer account type.');
  if (!errors.length && db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    errors.push('An account already exists for that email. Log in instead, or use another address.');
  }

  if (errors.length) {
    return res.status(400).render('auth/register', { title: 'Create an account', values, errors });
  }

  const info = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
    .run(name, email, bcrypt.hashSync(password, 10), role);

  req.session.user = { id: info.lastInsertRowid, name, email, role };
  req.flash('success', `Welcome to Campus Event Hub, ${name}.`);
  res.redirect('/events');
});

router.get('/login', (req, res) => {
  const next = typeof req.query.next === 'string' && req.query.next.startsWith('/') ? req.query.next : '/events';
  res.render('auth/login', { title: 'Log in', values: {}, errors: [], next });
});

router.post('/login', (req, res) => {
  const values = req.body;
  const email = (values.email || '').trim().toLowerCase();
  const password = values.password || '';
  const next = typeof values.next === 'string' && values.next.startsWith('/') ? values.next : '/events';
  const errors = [];

  if (!EMAIL.test(email)) errors.push('Enter the email address you registered with.');
  if (!password) errors.push('Enter your password.');

  const user = errors.length ? null : db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!errors.length && (!user || !bcrypt.compareSync(password, user.password_hash))) {
    errors.push('Email or password is incorrect. Check both fields and try again.');
  }

  if (errors.length) {
    return res.status(401).render('auth/login', { title: 'Log in', values, errors, next });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  req.flash('success', `Logged in as ${user.name}.`);
  res.redirect(next);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
