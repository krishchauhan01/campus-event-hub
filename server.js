const path = require('path');
const express = require('express');
const session = require('express-session');
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'campus-event-hub-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}));

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.error = null;
  res.locals.success = null;
  res.locals.errors = [];
  res.locals.formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : dateFormat.format(d);
  };
  if (req.session.flash) {
    res.locals[req.session.flash.type] = req.session.flash.message;
    delete req.session.flash;
  }
  req.flash = (type, message) => { req.session.flash = { type, message }; };
  next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/events'));
app.use('/', require('./routes/rsvp'));
app.use('/', require('./routes/reviews'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).render('404', { title: 'Page not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { title: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Campus Event Hub running at http://localhost:${PORT}`);
});
