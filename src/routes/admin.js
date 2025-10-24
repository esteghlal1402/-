/**
 * روت‌های مدیریت
 * Admin Routes
 */

const express = require('express');
const router = express.Router();

// Mock admin data
const adminStats = {
    users: {
        total: 150,
        active: 120,
        newToday: 5
    },
    messages: {
        total: 15420,
        today: 234,
        thisWeek: 1680
    },
    plugins: {
        total: 12,
        active: 8,
        inactive: 4
    },
    system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: require('../../package.json').version
    }
};

// Get dashboard stats
router.get('/dashboard', (req, res) => {
    try {
        res.json({
            stats: adminStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('خطا در دریافت آمار داشبورد:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get system health
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };

        res.json({
            health: health
        });
    } catch (error) {
        console.error('خطا در بررسی سلامت سیستم:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get logs
router.get('/logs', (req, res) => {
    try {
        const { level, limit = 100 } = req.query;
        
        // Mock log data
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'کاربر جدید وارد شد',
                userId: 'user123'
            },
            {
                timestamp: new Date().toISOString(),
                level: 'warn',
                message: 'محدودیت نرخ درخواست',
                ip: '192.168.1.1'
            },
            {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'خطا در اتصال دیتابیس',
                error: 'Connection timeout'
            }
        ];

        let filteredLogs = logs;
        if (level) {
            filteredLogs = logs.filter(log => log.level === level);
        }

        res.json({
            logs: filteredLogs.slice(0, limit),
            count: filteredLogs.length
        });
    } catch (error) {
        console.error('خطا در دریافت لاگ‌ها:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get user management
router.get('/users', (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        
        // Mock user data
        const users = Array.from({ length: 50 }, (_, i) => ({
            id: `user${i + 1}`,
            username: `user${i + 1}`,
            email: `user${i + 1}@example.com`,
            firstName: `کاربر`,
            lastName: `${i + 1}`,
            role: i < 5 ? 'admin' : 'user',
            isActive: i < 45,
            lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        let filteredUsers = users;
        if (search) {
            filteredUsers = users.filter(user => 
                user.username.includes(search) || 
                user.email.includes(search) ||
                user.firstName.includes(search) ||
                user.lastName.includes(search)
            );
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        res.json({
            users: paginatedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredUsers.length,
                pages: Math.ceil(filteredUsers.length / limit)
            }
        });
    } catch (error) {
        console.error('خطا در دریافت لیست کاربران:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Update user
router.put('/users/:id', (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        // Mock update
        res.json({
            message: 'کاربر با موفقیت به‌روزرسانی شد',
            userId: userId,
            updates: updates
        });
    } catch (error) {
        console.error('خطا در به‌روزرسانی کاربر:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Delete user
router.delete('/users/:id', (req, res) => {
    try {
        const userId = req.params.id;

        // Mock delete
        res.json({
            message: 'کاربر با موفقیت حذف شد',
            userId: userId
        });
    } catch (error) {
        console.error('خطا در حذف کاربر:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get system settings
router.get('/settings', (req, res) => {
    try {
        const settings = {
            bot: {
                name: 'ربات پیشرفته',
                language: 'fa',
                timezone: 'Asia/Tehran',
                maxMessageLength: 1000,
                rateLimit: {
                    windowMs: 900000,
                    maxRequests: 100
                }
            },
            security: {
                jwtSecret: '***',
                encryptionKey: '***',
                requireAuth: true,
                allowRegistration: true
            },
            features: {
                aiEnabled: true,
                fileUploadEnabled: true,
                pluginSystemEnabled: true,
                analyticsEnabled: true
            }
        };

        res.json({
            settings: settings
        });
    } catch (error) {
        console.error('خطا در دریافت تنظیمات:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Update system settings
router.put('/settings', (req, res) => {
    try {
        const updates = req.body;

        // Mock update
        res.json({
            message: 'تنظیمات با موفقیت به‌روزرسانی شد',
            updates: updates
        });
    } catch (error) {
        console.error('خطا در به‌روزرسانی تنظیمات:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

module.exports = router;