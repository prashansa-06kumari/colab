/**
 * AI Controller
 * Handles OpenAI API integration for text improvement
 */

const OpenAI = require('openai');

// Initialize OpenRouter client (compatible with OpenAI SDK)
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This will be your OpenRouter API key
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:5000", // Optional, for tracking
      "X-Title": "CollabSpace AI Assistant", // Optional, for tracking
    },
  });
} catch (error) {
  console.warn('⚠️ OpenRouter API key not found. AI features will be disabled.');
}

/**
 * Improve text using OpenAI API
 * POST /api/ai/improve
 */
const improveText = async (req, res) => {
  try {
    const { text, mode = 'grammar' } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    // Check if OpenAI is available
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please check your OpenAI API key.'
      });
    }


    // Define prompts based on mode
    const prompts = {
      grammar: `Correct the grammar in this text: ${text}`,
      rephrase: `Rephrase this text: ${text}`,
      summarize: `Summarize this text: ${text}`
    };

    const prompt = prompts[mode] || prompts.grammar;

    // Call OpenRouter API with a free model
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.2-3b-instruct:free", // Free model on OpenRouter
      messages: [
        {
          role: "system",
          content: "You are a helpful writing assistant. Always respond with clean, corrected text only. Do not include explanations, quotes, or special formatting. Just provide the improved text directly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    let improvedText = completion.choices[0].message.content.trim();
    
    // Clean up special tokens that some models return
    improvedText = improvedText.replace(/<s>/g, '').replace(/<\/s>/g, '').replace(/\[\/s>/g, '').trim();

    // Return response based on mode
    if (mode === 'summarize') {
      return res.json({
        success: true,
        original: text,
        improved: improvedText,
        mode: mode,
        summary: improvedText
      });
    } else {
      return res.json({
        success: true,
        original: text,
        improved: improvedText,
        mode: mode,
        fixed: improvedText
      });
    }

  } catch (error) {
    console.error('❌ AI improvement error:', error);
    
    // Handle specific OpenRouter errors
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        success: false,
        error: 'OpenRouter API quota exceeded. Please check your account or try a different model.'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: 'Invalid OpenRouter API key. Please check your configuration.'
      });
    }
    
    if (error.code === 'model_not_found') {
      return res.status(400).json({
        success: false,
        error: 'Model not available. Please try again or contact support.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to improve text. Please try again.'
    });
  }
};

module.exports = {
  improveText
};
