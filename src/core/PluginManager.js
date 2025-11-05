/**
 * مدیریت پلاگین‌ها
 * Plugin Manager
 */

const fs = require('fs-extra');
const path = require('path');
const vm = require('vm');

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.pluginDir = path.join(__dirname, '../plugins');
        this.loadedPlugins = new Set();
        this.pluginHooks = new Map();
    }

    async initialize() {
        try {
            // Ensure plugin directory exists
            await fs.ensureDir(this.pluginDir);
            
            // Load built-in plugins
            await this.loadBuiltInPlugins();
            
            // Load external plugins
            await this.loadExternalPlugins();
            
            console.log('سیستم پلاگین‌ها راه‌اندازی شد');
        } catch (error) {
            console.error('خطا در راه‌اندازی سیستم پلاگین‌ها:', error);
            throw error;
        }
    }

    async loadBuiltInPlugins() {
        const builtInPlugins = [
            'weather',
            'calculator',
            'translator',
            'fileManager',
            'imageProcessor',
            'textAnalyzer',
            'webScraper',
            'emailSender',
            'qrGenerator',
            'pdfProcessor'
        ];

        for (const pluginName of builtInPlugins) {
            try {
                await this.loadPlugin(pluginName, true);
            } catch (error) {
                console.warn(`خطا در بارگذاری پلاگین ${pluginName}:`, error.message);
            }
        }
    }

    async loadExternalPlugins() {
        try {
            const pluginFiles = await fs.readdir(this.pluginDir);
            
            for (const file of pluginFiles) {
                if (file.endsWith('.js')) {
                    const pluginName = path.basename(file, '.js');
                    try {
                        await this.loadPlugin(pluginName, false);
                    } catch (error) {
                        console.warn(`خطا در بارگذاری پلاگین خارجی ${pluginName}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.warn('خطا در خواندن پوشه پلاگین‌ها:', error.message);
        }
    }

    async loadPlugin(pluginName, isBuiltIn = false) {
        try {
            let pluginPath;
            if (isBuiltIn) {
                pluginPath = path.join(__dirname, `../plugins/builtin/${pluginName}.js`);
            } else {
                pluginPath = path.join(this.pluginDir, `${pluginName}.js`);
            }

            if (!await fs.pathExists(pluginPath)) {
                throw new Error(`فایل پلاگین یافت نشد: ${pluginPath}`);
            }

            const pluginCode = await fs.readFile(pluginPath, 'utf8');
            const plugin = this.createPluginInstance(pluginCode, pluginName);
            
            // Validate plugin
            this.validatePlugin(plugin);
            
            // Register plugin
            this.plugins.set(pluginName, plugin);
            this.loadedPlugins.add(pluginName);
            
            // Initialize plugin
            if (plugin.initialize) {
                await plugin.initialize();
            }

            console.log(`پلاگین ${pluginName} بارگذاری شد`);
            return plugin;

        } catch (error) {
            console.error(`خطا در بارگذاری پلاگین ${pluginName}:`, error);
            throw error;
        }
    }

    createPluginInstance(pluginCode, pluginName) {
        const sandbox = {
            console: console,
            require: require,
            module: { exports: {} },
            exports: {},
            __dirname: path.dirname(path.join(this.pluginDir, `${pluginName}.js`)),
            __filename: path.join(this.pluginDir, `${pluginName}.js`),
            process: process,
            Buffer: Buffer,
            setTimeout: setTimeout,
            setInterval: setInterval,
            clearTimeout: clearTimeout,
            clearInterval: clearInterval
        };

        const context = vm.createContext(sandbox);
        vm.runInContext(pluginCode, context);

        return context.module.exports;
    }

    validatePlugin(plugin) {
        if (!plugin.name) {
            throw new Error('پلاگین باید دارای نام باشد');
        }
        if (!plugin.version) {
            throw new Error('پلاگین باید دارای نسخه باشد');
        }
        if (!plugin.description) {
            throw new Error('پلاگین باید دارای توضیحات باشد');
        }
        if (!plugin.commands || !Array.isArray(plugin.commands)) {
            throw new Error('پلاگین باید دارای آرایه دستورات باشد');
        }
    }

    async executeCommand(command, params, userId) {
        try {
            // Find plugin that handles this command
            const plugin = this.findPluginByCommand(command);
            if (!plugin) {
                throw new Error(`دستور ${command} یافت نشد`);
            }

            // Check if plugin is active
            if (!plugin.isActive) {
                throw new Error(`پلاگین ${plugin.name} غیرفعال است`);
            }

            // Execute command
            const result = await plugin.executeCommand(command, params, userId);
            
            return {
                success: true,
                result: result,
                plugin: plugin.name,
                command: command
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: command
            };
        }
    }

    findPluginByCommand(command) {
        for (const [name, plugin] of this.plugins) {
            if (plugin.commands.some(cmd => cmd.name === command)) {
                return plugin;
            }
        }
        return null;
    }

    getPlugin(name) {
        return this.plugins.get(name);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }

    getActivePlugins() {
        return Array.from(this.plugins.values()).filter(plugin => plugin.isActive);
    }

    async activatePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`پلاگین ${name} یافت نشد`);
        }

        plugin.isActive = true;
        if (plugin.onActivate) {
            await plugin.onActivate();
        }

        console.log(`پلاگین ${name} فعال شد`);
    }

    async deactivatePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`پلاگین ${name} یافت نشد`);
        }

        plugin.isActive = false;
        if (plugin.onDeactivate) {
            await plugin.onDeactivate();
        }

        console.log(`پلاگین ${name} غیرفعال شد`);
    }

    async unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`پلاگین ${name} یافت نشد`);
        }

        if (plugin.onUnload) {
            await plugin.onUnload();
        }

        this.plugins.delete(name);
        this.loadedPlugins.delete(name);

        console.log(`پلاگین ${name} حذف شد`);
    }

    // Hook system
    registerHook(hookName, callback) {
        if (!this.pluginHooks.has(hookName)) {
            this.pluginHooks.set(hookName, []);
        }
        this.pluginHooks.get(hookName).push(callback);
    }

    async executeHook(hookName, data) {
        const hooks = this.pluginHooks.get(hookName) || [];
        const results = [];

        for (const hook of hooks) {
            try {
                const result = await hook(data);
                results.push(result);
            } catch (error) {
                console.error(`خطا در اجرای هوک ${hookName}:`, error);
            }
        }

        return results;
    }

    // Plugin development helpers
    createPluginTemplate(name, description) {
        const template = `/**
 * ${description}
 * Plugin: ${name}
 */

class ${name}Plugin {
    constructor() {
        this.name = '${name}';
        this.version = '1.0.0';
        this.description = '${description}';
        this.isActive = true;
        this.commands = [
            {
                name: '${name.toLowerCase()}',
                description: 'دستور ${name}',
                handler: 'handleCommand'
            }
        ];
    }

    async initialize() {
        console.log('پلاگین ${name} راه\u200cاندازی شد');
    }

    async executeCommand(command, params, userId) {
        switch (command) {
            case '${name.toLowerCase()}':
                return await this.handleCommand(params, userId);
            default:
                throw new Error('دستور نامعتبر');
        }
    }

    async handleCommand(params, userId) {
        return {
            message: 'دستور ${name} اجرا شد',
            data: { params, userId }
        };
    }

    async onActivate() {
        console.log('پلاگین ${name} فعال شد');
    }

    async onDeactivate() {
        console.log('پلاگین ${name} غیرفعال شد');
    }

    async onUnload() {
        console.log('پلاگین ${name} حذف شد');
    }
}

module.exports = new ${name}Plugin();`;

        return template;
    }

    async savePluginTemplate(name, description) {
        const template = this.createPluginTemplate(name, description);
        const filePath = path.join(this.pluginDir, `${name}.js`);
        await fs.writeFile(filePath, template);
        return filePath;
    }

    // Plugin statistics
    getPluginStats() {
        const stats = {
            total: this.plugins.size,
            active: this.getActivePlugins().length,
            inactive: this.plugins.size - this.getActivePlugins().length,
            commands: 0,
            hooks: this.pluginHooks.size
        };

        for (const plugin of this.plugins.values()) {
            stats.commands += plugin.commands ? plugin.commands.length : 0;
        }

        return stats;
    }

    // Cleanup
    async cleanup() {
        for (const [name, plugin] of this.plugins) {
            try {
                if (plugin.onUnload) {
                    await plugin.onUnload();
                }
            } catch (error) {
                console.error(`خطا در حذف پلاگین ${name}:`, error);
            }
        }

        this.plugins.clear();
        this.loadedPlugins.clear();
        this.pluginHooks.clear();
    }
}

module.exports = PluginManager;