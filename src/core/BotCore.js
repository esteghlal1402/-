/**
 * هسته اصلی ربات
 * Bot Core - Main bot engine
 */

const fs = require('fs-extra');
const path = require('path');
const natural = require('natural');
const sentiment = require('sentiment');
const translate = require('translate-google');

class BotCore {
    constructor(io, logger) {
        this.io = io;
        this.logger = logger;
        this.isInitialized = false;
        this.commands = new Map();
        this.contexts = new Map();
        this.memory = new Map();
        
        // Initialize NLP tools
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.sentimentAnalyzer = new sentiment();
        
        // Bot personality and responses
        this.personality = {
            name: 'ربات پیشرفته',
            version: '1.0.0',
            language: 'fa',
            responses: {
                greeting: [
                    'سلام! چطور می‌تونم کمکتون کنم؟',
                    'درود! چه کاری برات انجام بدم؟',
                    'سلام عزیز! چه خبر؟',
                    'خوش آمدید! چطور می‌تونم خدمتتون باشم؟'
                ],
                unknown: [
                    'متوجه نشدم. می‌تونید دوباره توضیح بدید؟',
                    'عذرخواهی می‌کنم، درست متوجه نشدم.',
                    'لطفاً واضح‌تر بگید چه کاری می‌خواید انجام بدم.',
                    'می‌تونید از دستورات موجود استفاده کنید.'
                ],
                error: [
                    'متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
                    'اوه! مشکلی پیش اومد. بذارید درستش کنم.',
                    'خطای موقتی رخ داد. دوباره امتحان کنید.'
                ]
            }
        };
    }

    async initialize() {
        try {
            this.logger.info('راه‌اندازی هسته ربات...');
            
            // Load built-in commands
            await this.loadBuiltInCommands();
            
            // Initialize memory system
            await this.initializeMemory();
            
            // Load user contexts
            await this.loadContexts();
            
            this.isInitialized = true;
            this.logger.info('هسته ربات با موفقیت راه‌اندازی شد');
            
        } catch (error) {
            this.logger.error('خطا در راه‌اندازی هسته ربات:', error);
            throw error;
        }
    }

    async loadBuiltInCommands() {
        const commands = [
            {
                name: 'help',
                description: 'نمایش راهنما و دستورات موجود',
                handler: this.handleHelpCommand.bind(this)
            },
            {
                name: 'time',
                description: 'نمایش زمان فعلی',
                handler: this.handleTimeCommand.bind(this)
            },
            {
                name: 'weather',
                description: 'نمایش وضعیت آب و هوا',
                handler: this.handleWeatherCommand.bind(this)
            },
            {
                name: 'translate',
                description: 'ترجمه متن',
                handler: this.handleTranslateCommand.bind(this)
            },
            {
                name: 'sentiment',
                description: 'تحلیل احساسات متن',
                handler: this.handleSentimentCommand.bind(this)
            },
            {
                name: 'memory',
                description: 'مدیریت حافظه ربات',
                handler: this.handleMemoryCommand.bind(this)
            },
            {
                name: 'file',
                description: 'مدیریت فایل‌ها',
                handler: this.handleFileCommand.bind(this)
            },
            {
                name: 'search',
                description: 'جستجو در اینترنت',
                handler: this.handleSearchCommand.bind(this)
            },
            {
                name: 'calculate',
                description: 'محاسبات ریاضی',
                handler: this.handleCalculateCommand.bind(this)
            },
            {
                name: 'qr',
                description: 'تولید کد QR',
                handler: this.handleQRCommand.bind(this)
            }
        ];

        commands.forEach(cmd => {
            this.commands.set(cmd.name, cmd);
        });

        this.logger.info(`${commands.length} دستور داخلی بارگذاری شد`);
    }

    async initializeMemory() {
        try {
            const memoryFile = path.join(__dirname, '../../data/memory.json');
            if (await fs.pathExists(memoryFile)) {
                const data = await fs.readJson(memoryFile);
                this.memory = new Map(Object.entries(data));
            }
        } catch (error) {
            this.logger.warn('خطا در بارگذاری حافظه:', error.message);
        }
    }

    async saveMemory() {
        try {
            const memoryFile = path.join(__dirname, '../../data/memory.json');
            await fs.ensureDir(path.dirname(memoryFile));
            const data = Object.fromEntries(this.memory);
            await fs.writeJson(memoryFile, data, { spaces: 2 });
        } catch (error) {
            this.logger.error('خطا در ذخیره حافظه:', error);
        }
    }

    async loadContexts() {
        try {
            const contextsFile = path.join(__dirname, '../../data/contexts.json');
            if (await fs.pathExists(contextsFile)) {
                const data = await fs.readJson(contextsFile);
                this.contexts = new Map(Object.entries(data));
            }
        } catch (error) {
            this.logger.warn('خطا در بارگذاری زمینه‌ها:', error.message);
        }
    }

    async saveContexts() {
        try {
            const contextsFile = path.join(__dirname, '../../data/contexts.json');
            await fs.ensureDir(path.dirname(contextsFile));
            const data = Object.fromEntries(this.contexts);
            await fs.writeJson(contextsFile, data, { spaces: 2 });
        } catch (error) {
            this.logger.error('خطا در ذخیره زمینه‌ها:', error);
        }
    }

    async processMessage(message, userId) {
        try {
            if (!this.isInitialized) {
                throw new Error('ربات هنوز راه‌اندازی نشده است');
            }

            // Store message in context
            this.addToContext(userId, message);

            // Analyze message
            const analysis = this.analyzeMessage(message);
            
            // Check for commands
            const command = this.extractCommand(message);
            if (command) {
                return await this.executeCommand(command, message, userId);
            }

            // Generate contextual response
            const response = await this.generateResponse(message, userId, analysis);
            
            return {
                message: response,
                type: 'text',
                analysis: analysis,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('خطا در پردازش پیام:', error);
            return {
                message: this.getRandomResponse('error'),
                type: 'error',
                timestamp: new Date().toISOString()
            };
        }
    }

    analyzeMessage(message) {
        const tokens = this.tokenizer.tokenize(message);
        const sentiment = this.sentimentAnalyzer.analyze(message);
        
        return {
            tokens: tokens,
            sentiment: sentiment,
            language: this.detectLanguage(message),
            length: message.length,
            wordCount: tokens.length,
            timestamp: new Date().toISOString()
        };
    }

    detectLanguage(text) {
        // Simple language detection based on character patterns
        const persianPattern = /[\u0600-\u06FF]/;
        const englishPattern = /[a-zA-Z]/;
        
        if (persianPattern.test(text)) return 'fa';
        if (englishPattern.test(text)) return 'en';
        return 'unknown';
    }

    extractCommand(message) {
        const commandPattern = /^[\/!]([a-zA-Z0-9_]+)/;
        const match = message.match(commandPattern);
        return match ? match[1].toLowerCase() : null;
    }

    async executeCommand(commandName, message, userId) {
        const command = this.commands.get(commandName);
        if (!command) {
            return {
                message: `دستور "${commandName}" یافت نشد. از /help استفاده کنید.`,
                type: 'error'
            };
        }

        try {
            const result = await command.handler(message, userId);
            return {
                message: result.message || result,
                type: result.type || 'text',
                data: result.data
            };
        } catch (error) {
            this.logger.error(`خطا در اجرای دستور ${commandName}:`, error);
            return {
                message: `خطا در اجرای دستور: ${error.message}`,
                type: 'error'
            };
        }
    }

    async generateResponse(message, userId, analysis) {
        // Get user context
        const context = this.contexts.get(userId) || [];
        
        // Check for greetings
        if (this.isGreeting(message)) {
            return this.getRandomResponse('greeting');
        }

        // Check sentiment and respond accordingly
        if (analysis.sentiment.score < -2) {
            return 'متأسفم که احساس خوبی ندارید. چطور می‌تونم کمکتون کنم؟';
        }

        // Generate contextual response based on previous messages
        if (context.length > 0) {
            const lastMessage = context[context.length - 1];
            if (this.isQuestion(lastMessage)) {
                return this.generateAnswer(message, lastMessage);
            }
        }

        // Default response
        return this.getRandomResponse('unknown');
    }

    isGreeting(message) {
        const greetings = ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'شب بخیر', 'hi', 'hello', 'hey'];
        return greetings.some(greeting => 
            message.toLowerCase().includes(greeting.toLowerCase())
        );
    }

    isQuestion(message) {
        return message.includes('؟') || message.includes('?') || 
               message.toLowerCase().includes('چطور') || 
               message.toLowerCase().includes('چرا') ||
               message.toLowerCase().includes('چی') ||
               message.toLowerCase().includes('کجا');
    }

    generateAnswer(message, question) {
        // Simple answer generation based on question type
        if (question.includes('چطور')) {
            return 'این سوال خوبیه! بذارید بیشتر توضیح بدید تا بتونم کمکتون کنم.';
        }
        if (question.includes('چرا')) {
            return 'دلایل مختلفی می‌تونه داشته باشه. بذارید بیشتر بررسی کنیم.';
        }
        return 'جالب بود! می‌تونید بیشتر توضیح بدید؟';
    }

    addToContext(userId, message) {
        if (!this.contexts.has(userId)) {
            this.contexts.set(userId, []);
        }
        
        const context = this.contexts.get(userId);
        context.push({
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 messages
        if (context.length > 10) {
            context.shift();
        }
        
        this.saveContexts();
    }

    getRandomResponse(type) {
        const responses = this.personality.responses[type] || this.personality.responses.unknown;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Command handlers
    async handleHelpCommand(message, userId) {
        const commandList = Array.from(this.commands.values())
            .map(cmd => `/${cmd.name}: ${cmd.description}`)
            .join('\n');
        
        return {
            message: `دستورات موجود:\n\n${commandList}\n\nبرای استفاده از هر دستور، /نام_دستور را تایپ کنید.`,
            type: 'help'
        };
    }

    async handleTimeCommand(message, userId) {
        const now = new Date();
        const persianTime = now.toLocaleString('fa-IR');
        const utcTime = now.toISOString();
        
        return {
            message: `زمان فعلی:\nفارسی: ${persianTime}\nUTC: ${utcTime}`,
            type: 'time',
            data: { timestamp: now }
        };
    }

    async handleWeatherCommand(message, userId) {
        // Extract location from message
        const location = this.extractLocation(message) || 'تهران';
        
        try {
            // This would integrate with a weather API
            return {
                message: `وضعیت آب و هوای ${location} در حال بارگذاری...`,
                type: 'weather',
                data: { location: location }
            };
        } catch (error) {
            return {
                message: 'خطا در دریافت اطلاعات آب و هوا',
                type: 'error'
            };
        }
    }

    async handleTranslateCommand(message, userId) {
        const text = message.replace(/^\/translate\s*/, '');
        if (!text) {
            return {
                message: 'لطفاً متنی برای ترجمه وارد کنید. مثال: /translate Hello world',
                type: 'error'
            };
        }

        try {
            const translated = await translate(text, { from: 'en', to: 'fa' });
            return {
                message: `ترجمه: ${translated}`,
                type: 'translation',
                data: { original: text, translated: translated }
            };
        } catch (error) {
            return {
                message: 'خطا در ترجمه متن',
                type: 'error'
            };
        }
    }

    async handleSentimentCommand(message, userId) {
        const text = message.replace(/^\/sentiment\s*/, '');
        if (!text) {
            return {
                message: 'لطفاً متنی برای تحلیل احساسات وارد کنید.',
                type: 'error'
            };
        }

        const analysis = this.sentimentAnalyzer.analyze(text);
        const sentimentText = analysis.score > 0 ? 'مثبت' : analysis.score < 0 ? 'منفی' : 'خنثی';
        
        return {
            message: `تحلیل احساسات: ${sentimentText}\nامتیاز: ${analysis.score}`,
            type: 'sentiment',
            data: analysis
        };
    }

    async handleMemoryCommand(message, userId) {
        const parts = message.split(' ');
        const action = parts[1];
        
        switch (action) {
            case 'save':
                const key = parts[2];
                const value = parts.slice(3).join(' ');
                if (key && value) {
                    this.memory.set(key, value);
                    await this.saveMemory();
                    return { message: `اطلاعات "${key}" ذخیره شد`, type: 'success' };
                }
                break;
                
            case 'get':
                const getKey = parts[2];
                if (getKey) {
                    const value = this.memory.get(getKey);
                    return { 
                        message: value ? `"${getKey}": ${value}` : `"${getKey}" یافت نشد`,
                        type: 'info'
                    };
                }
                break;
                
            case 'list':
                const keys = Array.from(this.memory.keys());
                return { 
                    message: `کلیدهای موجود: ${keys.join(', ')}`,
                    type: 'info',
                    data: keys
                };
                
            default:
                return { 
                    message: 'استفاده: /memory [save|get|list] [key] [value]',
                    type: 'help'
                };
        }
    }

    async handleFileCommand(message, userId) {
        return {
            message: 'سیستم مدیریت فایل در حال توسعه است...',
            type: 'info'
        };
    }

    async handleSearchCommand(message, userId) {
        const query = message.replace(/^\/search\s*/, '');
        if (!query) {
            return {
                message: 'لطفاً کلمه‌ای برای جستجو وارد کنید.',
                type: 'error'
            };
        }

        return {
            message: `جستجو برای "${query}" در حال انجام است...`,
            type: 'search',
            data: { query: query }
        };
    }

    async handleCalculateCommand(message, userId) {
        const expression = message.replace(/^\/calculate\s*/, '');
        if (!expression) {
            return {
                message: 'لطفاً عبارت ریاضی وارد کنید. مثال: /calculate 2+2',
                type: 'error'
            };
        }

        try {
            // Simple calculation (in production, use a proper math parser)
            const result = eval(expression);
            return {
                message: `${expression} = ${result}`,
                type: 'calculation',
                data: { expression: expression, result: result }
            };
        } catch (error) {
            return {
                message: 'خطا در محاسبه. لطفاً عبارت معتبر وارد کنید.',
                type: 'error'
            };
        }
    }

    async handleQRCommand(message, userId) {
        const text = message.replace(/^\/qr\s*/, '');
        if (!text) {
            return {
                message: 'لطفاً متنی برای تولید QR کد وارد کنید.',
                type: 'error'
            };
        }

        return {
            message: `QR کد برای "${text}" در حال تولید است...`,
            type: 'qr',
            data: { text: text }
        };
    }

    extractLocation(text) {
        // Simple location extraction
        const locationPattern = /(?:در|از|به)\s+([آ-ی\s]+)/;
        const match = text.match(locationPattern);
        return match ? match[1].trim() : null;
    }

    async handleFileUpload(fileData, userId) {
        // This would handle file uploads
        return {
            message: 'فایل با موفقیت آپلود شد',
            type: 'file_upload',
            data: fileData
        };
    }
}

module.exports = BotCore;