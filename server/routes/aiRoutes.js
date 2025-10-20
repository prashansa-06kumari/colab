/**
 * AI Routes
 * Routes for AI-powered text improvement features
 */

const express = require('express');
const router = express.Router();
const { improveText } = require('../controllers/aiController');

/**
 * POST /api/ai/improve
 * Improve text using OpenAI API
 * Body: { text: string, mode: 'grammar' | 'rephrase' | 'summarize' }
 */
router.post('/improve', improveText);

module.exports = router;
