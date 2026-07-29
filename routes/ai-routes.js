const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Min
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const ip = req.ip;
    const path = req.originalUrl;
    console.warn(`[429] AI limit exceeded | IP: ${ip} | Route: ${path}`);
    res.status(options.statusCode).json({ message: 'Too many AI requests. Please try again later.' });
  },
});

const requireLogin = (req, res, next) => {
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  const hasPassportSession = Boolean(req.session?.passport?.user);

  if (isAuthenticated || hasPassportSession) {
    next();
    return;
  }

  res.status(401).json({ message: 'You must be logged in to access this content' });
};

router.post('/ai/chat', aiLimiter, requireLogin, async (req, res) => {
  const { messages, model = 'openai/gpt-oss-20b:free', temperature = 0.7, max_tokens = 350 } = req.body || {};
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.status(500).json({ message: 'AI service is not configured.' });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ message: 'No messages were provided.' });
    return;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'AI service is currently unavailable.';
      res.status(response.status).json({ message: errorMessage });
      return;
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      res.status(502).json({ message: 'Could not receive AI response.' });
      return;
    }

    res.status(200).json({ answer });
  } catch (error) {
    console.error('OpenRouter proxy error', error);
    res.status(502).json({ message: 'Error connecting to AI service.' });
  }
});

module.exports = router;
