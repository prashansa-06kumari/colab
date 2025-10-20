/**
 * Points Routes
 * API endpoints for points system
 */

const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Points routes working' });
});

module.exports = router;
