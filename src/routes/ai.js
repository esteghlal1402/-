/**
 * روت‌های هوش مصنوعی
 * AI Routes
 */

const express = require('express');
const router = express.Router();

// Mock AI responses (in production, integrate with real AI services)
const aiResponses = {
    greeting: [
        'سلام! چطور می‌تونم کمکتون کنم؟',
        'درود! چه کاری برات انجام بدم؟',
        'سلام عزیز! چه خبر؟',
        'خوش آمدید! چطور می‌تونم خدمتتون باشم؟'
    ],
    question: [
        'سوال جالبی پرسیدید! بذارید بیشتر توضیح بدید.',
        'این موضوع مهمیه. چطور می‌تونم کمکتون کنم؟',
        'بله، در این مورد می‌تونم کمکتون کنم.',
        'سوال خوبیه! بذارید بررسی کنم.'
    ],
    default: [
        'متوجه نشدم. می‌تونید دوباره توضیح بدید؟',
        'عذرخواهی می‌کنم، درست متوجه نشدم.',
        'لطفاً واضح‌تر بگید چه کاری می‌خواید انجام بدم.',
        'می‌تونید از دستورات موجود استفاده کنید.'
    ]
};

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, userId, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'پیام الزامی است'
            });
        }

        // Analyze message
        const analysis = analyzeMessage(message);
        
        // Generate response
        const response = generateResponse(message, analysis);

        res.json({
            message: response,
            analysis: analysis,
            sessionId: sessionId || generateSessionId(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطا در پردازش پیام:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Sentiment analysis endpoint
router.post('/sentiment', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'متن الزامی است'
            });
        }

        const sentiment = analyzeSentiment(text);

        res.json({
            text: text,
            sentiment: sentiment,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطا در تحلیل احساسات:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Translation endpoint
router.post('/translate', async (req, res) => {
    try {
        const { text, from, to } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'متن الزامی است'
            });
        }

        const translation = await translateText(text, from || 'auto', to || 'fa');

        res.json({
            originalText: text,
            translatedText: translation,
            from: from || 'auto',
            to: to || 'fa',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطا در ترجمه:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Text summarization endpoint
router.post('/summarize', async (req, res) => {
    try {
        const { text, maxLength } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'متن الزامی است'
            });
        }

        const summary = summarizeText(text, maxLength || 100);

        res.json({
            originalText: text,
            summary: summary,
            originalLength: text.length,
            summaryLength: summary.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطا در خلاصه‌سازی:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Keyword extraction endpoint
router.post('/keywords', async (req, res) => {
    try {
        const { text, count } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'متن الزامی است'
            });
        }

        const keywords = extractKeywords(text, count || 10);

        res.json({
            text: text,
            keywords: keywords,
            count: keywords.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطا در استخراج کلمات کلیدی:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Helper functions
function analyzeMessage(message) {
    const words = message.split(' ');
    const wordCount = words.length;
    const charCount = message.length;
    
    // Simple language detection
    const persianPattern = /[\u0600-\u06FF]/;
    const englishPattern = /[a-zA-Z]/;
    
    let language = 'unknown';
    if (persianPattern.test(message)) language = 'fa';
    else if (englishPattern.test(message)) language = 'en';
    
    // Detect question
    const isQuestion = message.includes('؟') || message.includes('?') || 
                      message.toLowerCase().includes('چطور') || 
                      message.toLowerCase().includes('چرا') ||
                      message.toLowerCase().includes('چی') ||
                      message.toLowerCase().includes('کجا');
    
    // Detect greeting
    const isGreeting = ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'شب بخیر', 'hi', 'hello', 'hey']
        .some(greeting => message.toLowerCase().includes(greeting.toLowerCase()));
    
    return {
        wordCount,
        charCount,
        language,
        isQuestion,
        isGreeting,
        timestamp: new Date().toISOString()
    };
}

function generateResponse(message, analysis) {
    if (analysis.isGreeting) {
        return getRandomResponse('greeting');
    }
    
    if (analysis.isQuestion) {
        return getRandomResponse('question');
    }
    
    return getRandomResponse('default');
}

function getRandomResponse(type) {
    const responses = aiResponses[type] || aiResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
}

function analyzeSentiment(text) {
    // Simple sentiment analysis
    const positiveWords = ['خوب', 'عالی', 'ممتاز', 'عالی', 'عالی', 'خوشحال', 'راضی', 'مثبت'];
    const negativeWords = ['بد', 'بد', 'بد', 'ناراضی', 'مشکل', 'خطا', 'منفی', 'بد'];
    
    const words = text.toLowerCase().split(' ');
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
    });
    
    const score = positiveCount - negativeCount;
    let sentiment = 'neutral';
    
    if (score > 0) sentiment = 'positive';
    else if (score < 0) sentiment = 'negative';
    
    return {
        score: score,
        sentiment: sentiment,
        positiveWords: positiveCount,
        negativeWords: negativeCount
    };
}

async function translateText(text, from, to) {
    // Mock translation (in production, use real translation API)
    const translations = {
        'hello': 'سلام',
        'world': 'جهان',
        'good': 'خوب',
        'bad': 'بد',
        'thank you': 'متشکرم',
        'welcome': 'خوش آمدید'
    };
    
    const lowerText = text.toLowerCase();
    return translations[lowerText] || `ترجمه ${text} (${from} -> ${to})`;
}

function summarizeText(text, maxLength) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 1) {
        return text.substring(0, maxLength);
    }
    
    // Simple summarization - take first sentence
    const summary = sentences[0].trim();
    return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
}

function extractKeywords(text, count) {
    // Simple keyword extraction
    const words = text.toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, count)
        .map(([word, count]) => ({ word, count }));
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = router;