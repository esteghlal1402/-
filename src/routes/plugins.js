/**
 * روت‌های مدیریت پلاگین‌ها
 * Plugin Management Routes
 */

const express = require('express');
const router = express.Router();

// Mock plugin data (in production, use real database)
const plugins = new Map();

// Initialize with some sample plugins
plugins.set('weather', {
    id: 'weather',
    name: 'آب و هوا',
    version: '1.0.0',
    description: 'نمایش وضعیت آب و هوا',
    author: 'Bot Developer',
    isActive: true,
    commands: [
        { name: 'weather', description: 'نمایش وضعیت آب و هوا' },
        { name: 'forecast', description: 'پیش‌بینی آب و هوا' }
    ],
    createdAt: new Date().toISOString()
});

plugins.set('calculator', {
    id: 'calculator',
    name: 'ماشین حساب',
    version: '1.0.0',
    description: 'محاسبات ریاضی و تبدیل واحدها',
    author: 'Bot Developer',
    isActive: true,
    commands: [
        { name: 'calc', description: 'محاسبات ریاضی' },
        { name: 'math', description: 'توابع ریاضی' },
        { name: 'convert', description: 'تبدیل واحدها' }
    ],
    createdAt: new Date().toISOString()
});

// Get all plugins
router.get('/', (req, res) => {
    try {
        const pluginList = Array.from(plugins.values());
        res.json({
            plugins: pluginList,
            count: pluginList.length
        });
    } catch (error) {
        console.error('خطا در دریافت لیست پلاگین‌ها:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get plugin by ID
router.get('/:id', (req, res) => {
    try {
        const pluginId = req.params.id;
        const plugin = plugins.get(pluginId);
        
        if (!plugin) {
            return res.status(404).json({
                error: 'پلاگین یافت نشد'
            });
        }

        res.json({
            plugin: plugin
        });
    } catch (error) {
        console.error('خطا در دریافت پلاگین:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Activate plugin
router.post('/:id/activate', (req, res) => {
    try {
        const pluginId = req.params.id;
        const plugin = plugins.get(pluginId);
        
        if (!plugin) {
            return res.status(404).json({
                error: 'پلاگین یافت نشد'
            });
        }

        plugin.isActive = true;
        plugins.set(pluginId, plugin);

        res.json({
            message: 'پلاگین فعال شد',
            plugin: plugin
        });
    } catch (error) {
        console.error('خطا در فعال‌سازی پلاگین:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Deactivate plugin
router.post('/:id/deactivate', (req, res) => {
    try {
        const pluginId = req.params.id;
        const plugin = plugins.get(pluginId);
        
        if (!plugin) {
            return res.status(404).json({
                error: 'پلاگین یافت نشد'
            });
        }

        plugin.isActive = false;
        plugins.set(pluginId, plugin);

        res.json({
            message: 'پلاگین غیرفعال شد',
            plugin: plugin
        });
    } catch (error) {
        console.error('خطا در غیرفعال‌سازی پلاگین:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Execute plugin command
router.post('/:id/execute', (req, res) => {
    try {
        const pluginId = req.params.id;
        const { command, params } = req.body;
        
        const plugin = plugins.get(pluginId);
        if (!plugin) {
            return res.status(404).json({
                error: 'پلاگین یافت نشد'
            });
        }

        if (!plugin.isActive) {
            return res.status(400).json({
                error: 'پلاگین غیرفعال است'
            });
        }

        // Mock command execution
        const result = {
            command: command,
            params: params,
            result: `دستور ${command} از پلاگین ${plugin.name} اجرا شد`,
            timestamp: new Date().toISOString()
        };

        res.json({
            message: 'دستور با موفقیت اجرا شد',
            result: result
        });
    } catch (error) {
        console.error('خطا در اجرای دستور پلاگین:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get plugin statistics
router.get('/stats/overview', (req, res) => {
    try {
        const pluginList = Array.from(plugins.values());
        const stats = {
            total: pluginList.length,
            active: pluginList.filter(p => p.isActive).length,
            inactive: pluginList.filter(p => !p.isActive).length,
            totalCommands: pluginList.reduce((sum, p) => sum + p.commands.length, 0)
        };

        res.json({
            stats: stats
        });
    } catch (error) {
        console.error('خطا در دریافت آمار پلاگین‌ها:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

module.exports = router;