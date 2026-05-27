// routes/users.js — User profile & my-reports
const express = require('express');
const router = express.Router();
const User  = require('../models/User');
const Issue = require('../models/Issue');
const { protect } = require('../middleware/auth');

// GET /api/users/me/reports — my submitted reports
router.get('/me/reports', protect, async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ issues, count: issues.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me — full profile with stats
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('reports');
    const stats = {
      total: user.reports.length,
      resolved: user.reports.filter(r => r.status === 'resolved').length,
      open:     user.reports.filter(r => r.status === 'open').length,
    };
    res.json({ user, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
