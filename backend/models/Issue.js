// models/Issue.js — Road issue schema
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 1000,
  },
  issueType: {
    type: String,
    enum: ['pothole', 'crack', 'waterlogging', 'broken_divider', 'missing_sign', 'other'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved'],
    default: 'open',
  },
  image: {
    type: String, // path to uploaded image
    default: '',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  aiPrediction: {
    issue_type:  { type: String, default: '' },
    severity:    { type: String, default: '' },
    confidence:  { type: Number, default: 0 },
  },
  votes: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Index for geo-queries
issueSchema.index({ 'location.lat': 1, 'location.lng': 1 });
issueSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('Issue', issueSchema);
