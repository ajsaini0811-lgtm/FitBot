function requireCoach(req, res, next) {
  if (!req.user || req.user.role !== 'COACH') {
    return res.status(403).json({ error: 'Coach access required' });
  }
  next();
}

module.exports = { requireCoach };
