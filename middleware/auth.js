function requireLogin(req, res, next) {
  if (!req.session.user) {
    const next = req.originalUrl.startsWith('/') ? req.originalUrl : '/events';
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login?next=' + encodeURIComponent(next));
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return requireLogin(req, res, next);
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('403', { title: 'Not allowed' });
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
