/**
 * سیستم لاگینگ پیشرفته
 * Advanced Logging System
 */

const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.initializeLogger();
    }

    initializeLogger() {
        // Ensure log directory exists
        fs.ensureDirSync(this.logDir);

        // Create custom format
        const customFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
                
                if (stack) {
                    logMessage += `\n${stack}`;
                }
                
                if (Object.keys(meta).length > 0) {
                    logMessage += `\n${JSON.stringify(meta, null, 2)}`;
                }
                
                return logMessage;
            })
        );

        // Create transports
        const transports = [
            // Console transport
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(
                    winston.format.colorize(),
                    customFormat
                )
            }),

            // File transport for all logs
            new winston.transports.File({
                filename: path.join(this.logDir, 'combined.log'),
                level: 'info',
                format: customFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }),

            // File transport for errors only
            new winston.transports.File({
                filename: path.join(this.logDir, 'error.log'),
                level: 'error',
                format: customFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }),

            // File transport for security events
            new winston.transports.File({
                filename: path.join(this.logDir, 'security.log'),
                level: 'warn',
                format: customFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 10
            })
        ];

        // Create logger
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: customFormat,
            transports: transports,
            exitOnError: false
        });

        // Add custom methods
        this.addCustomMethods();
    }

    addCustomMethods() {
        // Persian date logging
        this.logger.persian = (message, meta = {}) => {
            const persianDate = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
            this.logger.info(`[${persianDate}] ${message}`, meta);
        };

        // Security event logging
        this.logger.security = (event, details, meta = {}) => {
            this.logger.warn(`SECURITY: ${event} - ${details}`, {
                type: 'security',
                event: event,
                details: details,
                ...meta
            });
        };

        // User action logging
        this.logger.userAction = (action, userId, details, meta = {}) => {
            this.logger.info(`USER_ACTION: ${action}`, {
                type: 'user_action',
                action: action,
                userId: userId,
                details: details,
                ...meta
            });
        };

        // Bot response logging
        this.logger.botResponse = (message, response, meta = {}) => {
            this.logger.info(`BOT_RESPONSE: ${message} -> ${response}`, {
                type: 'bot_response',
                originalMessage: message,
                response: response,
                ...meta
            });
        };

        // Performance logging
        this.logger.performance = (operation, duration, meta = {}) => {
            this.logger.info(`PERFORMANCE: ${operation} took ${duration}ms`, {
                type: 'performance',
                operation: operation,
                duration: duration,
                ...meta
            });
        };

        // Database operation logging
        this.logger.database = (operation, collection, details, meta = {}) => {
            this.logger.info(`DATABASE: ${operation} on ${collection}`, {
                type: 'database',
                operation: operation,
                collection: collection,
                details: details,
                ...meta
            });
        };

        // API request logging
        this.logger.apiRequest = (method, url, statusCode, duration, meta = {}) => {
            this.logger.info(`API_REQUEST: ${method} ${url} - ${statusCode} (${duration}ms)`, {
                type: 'api_request',
                method: method,
                url: url,
                statusCode: statusCode,
                duration: duration,
                ...meta
            });
        };

        // Plugin operation logging
        this.logger.plugin = (pluginName, operation, details, meta = {}) => {
            this.logger.info(`PLUGIN: ${pluginName} - ${operation}`, {
                type: 'plugin',
                pluginName: pluginName,
                operation: operation,
                details: details,
                ...meta
            });
        };
    }

    // Standard logging methods
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Log rotation
    async rotateLogs() {
        try {
            const logFiles = await fs.readdir(this.logDir);
            const now = new Date();
            
            for (const file of logFiles) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = await fs.stat(filePath);
                    
                    // If file is older than 30 days, archive it
                    if (now - stats.mtime > 30 * 24 * 60 * 60 * 1000) {
                        const archiveName = file.replace('.log', `_${moment().format('YYYY-MM-DD')}.log`);
                        const archivePath = path.join(this.logDir, 'archive', archiveName);
                        
                        await fs.ensureDir(path.dirname(archivePath));
                        await fs.move(filePath, archivePath);
                        
                        this.info(`Log file archived: ${file} -> ${archiveName}`);
                    }
                }
            }
        } catch (error) {
            this.error('خطا در چرخش لاگ‌ها:', error);
        }
    }

    // Get log statistics
    async getLogStats() {
        try {
            const logFiles = await fs.readdir(this.logDir);
            const stats = {
                totalFiles: logFiles.length,
                totalSize: 0,
                files: []
            };

            for (const file of logFiles) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const fileStats = await fs.stat(filePath);
                    
                    stats.totalSize += fileStats.size;
                    stats.files.push({
                        name: file,
                        size: fileStats.size,
                        modified: fileStats.mtime
                    });
                }
            }

            return stats;
        } catch (error) {
            this.error('خطا در دریافت آمار لاگ‌ها:', error);
            return null;
        }
    }

    // Search logs
    async searchLogs(query, level = null, startDate = null, endDate = null) {
        try {
            const results = [];
            const logFiles = await fs.readdir(this.logDir);
            
            for (const file of logFiles) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.split('\n');
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        
                        if (line.includes(query)) {
                            // Parse log line
                            const logEntry = this.parseLogLine(line);
                            
                            // Apply filters
                            if (level && logEntry.level !== level) continue;
                            if (startDate && logEntry.timestamp < startDate) continue;
                            if (endDate && logEntry.timestamp > endDate) continue;
                            
                            results.push({
                                file: file,
                                line: i + 1,
                                ...logEntry
                            });
                        }
                    }
                }
            }
            
            return results;
        } catch (error) {
            this.error('خطا در جستجوی لاگ‌ها:', error);
            return [];
        }
    }

    parseLogLine(line) {
        const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
        const levelMatch = line.match(/\[(\w+)\]/);
        
        return {
            timestamp: timestampMatch ? timestampMatch[1] : null,
            level: levelMatch ? levelMatch[1].toLowerCase() : 'info',
            message: line
        };
    }

    // Clean old logs
    async cleanOldLogs(daysToKeep = 30) {
        try {
            const logFiles = await fs.readdir(this.logDir);
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            let deletedCount = 0;
            
            for (const file of logFiles) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        await fs.remove(filePath);
                        deletedCount++;
                        this.info(`Log file deleted: ${file}`);
                    }
                }
            }
            
            this.info(`${deletedCount} log files older than ${daysToKeep} days deleted`);
            return deletedCount;
        } catch (error) {
            this.error('خطا در پاک‌سازی لاگ‌های قدیمی:', error);
            return 0;
        }
    }

    // Export logs
    async exportLogs(format = 'json', startDate = null, endDate = null) {
        try {
            const logs = await this.searchLogs('', null, startDate, endDate);
            const exportData = {
                exportDate: new Date().toISOString(),
                totalLogs: logs.length,
                logs: logs
            };
            
            const exportPath = path.join(this.logDir, `export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.${format}`);
            
            if (format === 'json') {
                await fs.writeJson(exportPath, exportData, { spaces: 2 });
            } else if (format === 'csv') {
                const csvContent = this.convertToCSV(logs);
                await fs.writeFile(exportPath, csvContent);
            }
            
            this.info(`Logs exported to: ${exportPath}`);
            return exportPath;
        } catch (error) {
            this.error('خطا در صادرات لاگ‌ها:', error);
            return null;
        }
    }

    convertToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'level', 'message', 'file', 'line'];
        const csvRows = [headers.join(',')];
        
        for (const log of logs) {
            const row = [
                log.timestamp || '',
                log.level || '',
                `"${(log.message || '').replace(/"/g, '""')}"`,
                log.file || '',
                log.line || ''
            ];
            csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
    }
}

module.exports = Logger;