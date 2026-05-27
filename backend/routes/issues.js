// routes/issues.js — Road issue routes
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/issues — all issues (public, with filters)
router.get('/', async (req, res) => {
  try {
    const { status, severity, issueType, limit = 100 } = req.query;
    const filter = {};
    if (status)    filter.status = status;
    if (severity)  filter.severity = severity;
    if (issueType) filter.issueType = issueType;

    const issues = await Issue.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ issues, count: issues.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/issues/stats — public dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const total    = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'resolved' });
    const open     = await Issue.countDocuments({ status: 'open' });
    const critical = await Issue.countDocuments({ severity: 'critical' });
    res.json({ total, resolved, open, critical });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/issues/:id — single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('createdBy', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/issues — create new issue (protected)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, issueType, severity, lat, lng, address } = req.body;

    if (!title || !description || !issueType || !severity || !lat || !lng)
      return res.status(400).json({ message: 'Required fields missing' });

    let aiPrediction = {};

    // Call AI microservice if image uploaded
    if (req.file) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const aiRes = await axios.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict`,
          formData,
          { headers: formData.getHeaders(), timeout: 10000 }
        );
        aiPrediction = aiRes.data;
      } catch (aiErr) {
        console.warn('AI service unavailable, skipping prediction:', aiErr.message);
      }
    }

    const issue = await Issue.create({
      title,
      description,
      issueType,
      severity,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      location: { lat: Number(lat), lng: Number(lng), address: address || '' },
      aiPrediction,
      createdBy: req.user._id,
    });

    // Add issue ref to user's reports
    await User.findByIdAndUpdate(req.user._id, { $push: { reports: issue._id } });

    res.status(201).json({ issue, aiPrediction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/issues/:id/status — update status (protected)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/issues/:id (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await issue.deleteOne();
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
