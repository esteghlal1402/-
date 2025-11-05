/**
 * ربات همه کاره پیشرفته
 * Advanced Multipurpose Bot
 * 
 * این ربات شامل امکانات زیر است:
 * - هوش مصنوعی و پردازش زبان طبیعی
 * - مدیریت فایل و دیتابیس
 * - امنیت و احراز هویت
 * - رابط کاربری وب
 * - API و امکانات شبکه‌ای
 * - سیستم پلاگین و ماژولار
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import core modules
const BotCore = require('./core/BotCore');
const DatabaseManager = require('./core/DatabaseManager');
const SecurityManager = require('./core/SecurityManager');
const PluginManager = require('./core/PluginManager');
const Logger = require('./utils/Logger');

class AdvancedBot {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.logger = new Logger();
        
        // Initialize core components
        this.botCore = new BotCore(this.io, this.logger);
        this.dbManager = new DatabaseManager();
        this.securityManager = new SecurityManager();
        this.pluginManager = new PluginManager();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: 'تعداد درخواست‌ها بیش از حد مجاز است'
        });
        this.app.use('/api/', limiter);

        // CORS
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' ? false : true,
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use('/static', express.static('src/ui/public'));
        this.app.use('/uploads', express.static('uploads'));

        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // API Routes
        this.app.use('/api/auth', require('./routes/auth'));
        this.app.use('/api/files', require('./routes/files'));
        this.app.use('/api/ai', require('./routes/ai'));
        this.app.use('/api/plugins', require('./routes/plugins'));
        this.app.use('/api/admin', require('./routes/admin'));
        this.app.use('/api/chat', require('./routes/chat'));

        // Web UI Routes
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/ui/views/index.html');
        });

        this.app.get('/admin', (req, res) => {
            res.sendFile(__dirname + '/ui/views/admin.html');
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: require('../package.json').version
            });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info(`کاربر جدید متصل شد: ${socket.id}`);

            // Handle chat messages
            socket.on('chat_message', async (data) => {
                try {
                    const response = await this.botCore.processMessage(data.message, socket.id);
                    socket.emit('bot_response', {
                        message: response.message,
                        type: response.type,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    this.logger.error('خطا در پردازش پیام:', error);
                    socket.emit('error', { message: 'خطا در پردازش پیام' });
                }
            });

            // Handle file uploads
            socket.on('file_upload', async (data) => {
                try {
                    const result = await this.botCore.handleFileUpload(data, socket.id);
                    socket.emit('file_uploaded', result);
                } catch (error) {
                    this.logger.error('خطا در آپلود فایل:', error);
                    socket.emit('error', { message: 'خطا در آپلود فایل' });
                }
            });

            // Handle plugin commands
            socket.on('plugin_command', async (data) => {
                try {
                    const result = await this.pluginManager.executeCommand(data.command, data.params, socket.id);
                    socket.emit('plugin_response', result);
                } catch (error) {
                    this.logger.error('خطا در اجرای پلاگین:', error);
                    socket.emit('error', { message: 'خطا در اجرای پلاگین' });
                }
            });

            socket.on('disconnect', () => {
                this.logger.info(`کاربر قطع شد: ${socket.id}`);
            });
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'صفحه مورد نظر یافت نشد',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            this.logger.error('خطای سرور:', error);
            res.status(500).json({
                error: 'خطای داخلی سرور',
                message: process.env.NODE_ENV === 'development' ? error.message : 'خطای غیرمنتظره',
                timestamp: new Date().toISOString()
            });
        });

        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }

    async start() {
        try {
            // Connect to database
            await this.dbManager.connect();
            this.logger.info('اتصال به دیتابیس برقرار شد');

            // Initialize security
            await this.securityManager.initialize();
            this.logger.info('سیستم امنیتی راه‌اندازی شد');

            // Load plugins
            await this.pluginManager.loadPlugins();
            this.logger.info('پلاگین‌ها بارگذاری شدند');

            // Start server
            this.server.listen(this.port, () => {
                this.logger.info(`ربات روی پورت ${this.port} راه‌اندازی شد`);
                this.logger.info(`رابط کاربری: http://localhost:${this.port}`);
                this.logger.info(`پنل مدیریت: http://localhost:${this.port}/admin`);
            });

            // Initialize bot core
            await this.botCore.initialize();
            this.logger.info('هسته ربات راه‌اندازی شد');

        } catch (error) {
            this.logger.error('خطا در راه‌اندازی ربات:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            this.logger.info('در حال خاموش کردن ربات...');
            
            // Close database connection
            await this.dbManager.disconnect();
            
            // Close server
            this.server.close(() => {
                this.logger.info('ربات با موفقیت خاموش شد');
                process.exit(0);
            });
        } catch (error) {
            this.logger.error('خطا در خاموش کردن ربات:', error);
            process.exit(1);
        }
    }
}

// Start the bot
const bot = new AdvancedBot();

// Graceful shutdown
process.on('SIGTERM', () => bot.stop());
process.on('SIGINT', () => bot.stop());

// Start the bot
bot.start().catch(error => {
    console.error('خطا در راه‌اندازی ربات:', error);
    process.exit(1);
});

module.exports = AdvancedBot;