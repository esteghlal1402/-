/**
 * مدیریت دیتابیس
 * Database Manager
 */

const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.models = new Map();
        this.isConnected = false;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/advanced-bot';
            
            this.connection = await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.isConnected = true;
            console.log('اتصال به MongoDB برقرار شد');

            // Initialize models
            await this.initializeModels();

        } catch (error) {
            console.error('خطا در اتصال به دیتابیس:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                this.isConnected = false;
                console.log('اتصال به دیتابیس قطع شد');
            }
        } catch (error) {
            console.error('خطا در قطع اتصال دیتابیس:', error);
        }
    }

    async initializeModels() {
        // User Model
        const userSchema = new mongoose.Schema({
            username: { type: String, required: true, unique: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
            isActive: { type: Boolean, default: true },
            lastLogin: { type: Date },
            preferences: {
                language: { type: String, default: 'fa' },
                theme: { type: String, default: 'light' },
                notifications: { type: Boolean, default: true }
            },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        // Chat Session Model
        const chatSessionSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            sessionId: { type: String, required: true },
            messages: [{
                type: { type: String, enum: ['user', 'bot'], required: true },
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                metadata: { type: mongoose.Schema.Types.Mixed }
            }],
            context: { type: mongoose.Schema.Types.Mixed },
            isActive: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        // File Model
        const fileSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            filename: { type: String, required: true },
            originalName: { type: String, required: true },
            mimeType: { type: String, required: true },
            size: { type: Number, required: true },
            path: { type: String, required: true },
            isPublic: { type: Boolean, default: false },
            tags: [String],
            metadata: { type: mongoose.Schema.Types.Mixed },
            createdAt: { type: Date, default: Date.now }
        });

        // Plugin Model
        const pluginSchema = new mongoose.Schema({
            name: { type: String, required: true, unique: true },
            version: { type: String, required: true },
            description: { type: String },
            author: { type: String },
            isActive: { type: Boolean, default: true },
            config: { type: mongoose.Schema.Types.Mixed },
            commands: [{
                name: { type: String, required: true },
                description: { type: String },
                handler: { type: String, required: true }
            }],
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        // Bot Memory Model
        const memorySchema = new mongoose.Schema({
            key: { type: String, required: true, unique: true },
            value: { type: mongoose.Schema.Types.Mixed, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            category: { type: String, default: 'general' },
            expiresAt: { type: Date },
            createdAt: { type: Date, default: Date.now }
        });

        // Analytics Model
        const analyticsSchema = new mongoose.Schema({
            event: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            sessionId: { type: String },
            data: { type: mongoose.Schema.Types.Mixed },
            timestamp: { type: Date, default: Date.now }
        });

        // Create models
        this.models.set('User', mongoose.model('User', userSchema));
        this.models.set('ChatSession', mongoose.model('ChatSession', chatSessionSchema));
        this.models.set('File', mongoose.model('File', fileSchema));
        this.models.set('Plugin', mongoose.model('Plugin', pluginSchema));
        this.models.set('Memory', mongoose.model('Memory', memorySchema));
        this.models.set('Analytics', mongoose.model('Analytics', analyticsSchema));

        console.log('مدل‌های دیتابیس راه‌اندازی شدند');
    }

    getModel(name) {
        return this.models.get(name);
    }

    // User operations
    async createUser(userData) {
        const User = this.getModel('User');
        const user = new User(userData);
        return await user.save();
    }

    async findUser(query) {
        const User = this.getModel('User');
        return await User.findOne(query);
    }

    async updateUser(userId, updateData) {
        const User = this.getModel('User');
        return await User.findByIdAndUpdate(userId, updateData, { new: true });
    }

    async deleteUser(userId) {
        const User = this.getModel('User');
        return await User.findByIdAndDelete(userId);
    }

    // Chat session operations
    async createChatSession(sessionData) {
        const ChatSession = this.getModel('ChatSession');
        const session = new ChatSession(sessionData);
        return await session.save();
    }

    async findChatSession(query) {
        const ChatSession = this.getModel('ChatSession');
        return await ChatSession.findOne(query);
    }

    async addMessageToSession(sessionId, message) {
        const ChatSession = this.getModel('ChatSession');
        return await ChatSession.findByIdAndUpdate(
            sessionId,
            { $push: { messages: message } },
            { new: true }
        );
    }

    async getChatHistory(sessionId, limit = 50) {
        const ChatSession = this.getModel('ChatSession');
        const session = await ChatSession.findById(sessionId)
            .populate('userId', 'username firstName lastName')
            .select('messages createdAt updatedAt');
        
        if (!session) return null;
        
        return {
            sessionId: session._id,
            user: session.userId,
            messages: session.messages.slice(-limit),
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
    }

    // File operations
    async saveFile(fileData) {
        const File = this.getModel('File');
        const file = new File(fileData);
        return await file.save();
    }

    async findFile(query) {
        const File = this.getModel('File');
        return await File.findOne(query);
    }

    async getUserFiles(userId, limit = 20) {
        const File = this.getModel('File');
        return await File.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    async deleteFile(fileId) {
        const File = this.getModel('File');
        return await File.findByIdAndDelete(fileId);
    }

    // Plugin operations
    async savePlugin(pluginData) {
        const Plugin = this.getModel('Plugin');
        const plugin = new Plugin(pluginData);
        return await plugin.save();
    }

    async findPlugin(query) {
        const Plugin = this.getModel('Plugin');
        return await Plugin.findOne(query);
    }

    async getActivePlugins() {
        const Plugin = this.getModel('Plugin');
        return await Plugin.find({ isActive: true });
    }

    async updatePlugin(pluginId, updateData) {
        const Plugin = this.getModel('Plugin');
        return await Plugin.findByIdAndUpdate(pluginId, updateData, { new: true });
    }

    // Memory operations
    async saveMemory(key, value, userId = null, category = 'general', expiresAt = null) {
        const Memory = this.getModel('Memory');
        const memory = new Memory({
            key,
            value,
            userId,
            category,
            expiresAt
        });
        return await memory.save();
    }

    async getMemory(key) {
        const Memory = this.getModel('Memory');
        return await Memory.findOne({ key });
    }

    async getUserMemories(userId, category = null) {
        const Memory = this.getModel('Memory');
        const query = { userId };
        if (category) query.category = category;
        return await Memory.find(query);
    }

    async deleteMemory(key) {
        const Memory = this.getModel('Memory');
        return await Memory.findOneAndDelete({ key });
    }

    // Analytics operations
    async logEvent(event, data, userId = null, sessionId = null) {
        const Analytics = this.getModel('Analytics');
        const analytics = new Analytics({
            event,
            userId,
            sessionId,
            data
        });
        return await analytics.save();
    }

    async getAnalytics(query = {}, limit = 100) {
        const Analytics = this.getModel('Analytics');
        return await Analytics.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('userId', 'username');
    }

    // Database health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'دیتابیس متصل نیست' };
            }

            const User = this.getModel('User');
            const userCount = await User.countDocuments();
            
            return {
                status: 'healthy',
                message: 'دیتابیس سالم است',
                userCount: userCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'خطا در بررسی سلامت دیتابیس',
                error: error.message
            };
        }
    }

    // Backup operations
    async createBackup() {
        try {
            const backupData = {};
            const collections = ['User', 'ChatSession', 'File', 'Plugin', 'Memory', 'Analytics'];
            
            for (const collection of collections) {
                const Model = this.getModel(collection);
                backupData[collection] = await Model.find({});
            }

            const backupPath = path.join(__dirname, '../../backups');
            await fs.ensureDir(backupPath);
            
            const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(backupPath, filename);
            
            await fs.writeJson(filepath, backupData, { spaces: 2 });
            
            return {
                success: true,
                filename: filename,
                path: filepath,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Cleanup operations
    async cleanupExpiredData() {
        try {
            const Memory = this.getModel('Memory');
            const result = await Memory.deleteMany({
                expiresAt: { $lt: new Date() }
            });

            return {
                success: true,
                deletedCount: result.deletedCount,
                message: `${result.deletedCount} آیتم منقضی شده حذف شد`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DatabaseManager;