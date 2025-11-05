/**
 * مدیریت امنیت
 * Security Manager
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('rate-limiter-flexible');
const helmet = require('helmet');

class SecurityManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-32-character-encryption-key';
        this.rateLimiters = new Map();
        this.blacklist = new Set();
        this.failedAttempts = new Map();
        this.maxFailedAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }

    async initialize() {
        try {
            // Initialize rate limiters
            this.initializeRateLimiters();
            
            // Load blacklist from database or file
            await this.loadBlacklist();
            
            console.log('سیستم امنیتی راه‌اندازی شد');
        } catch (error) {
            console.error('خطا در راه‌اندازی سیستم امنیتی:', error);
            throw error;
        }
    }

    initializeRateLimiters() {
        // Login rate limiter
        this.rateLimiters.set('login', new rateLimit.RateLimiterMemory({
            keyPrefix: 'login',
            points: 5, // 5 attempts
            duration: 900, // per 15 minutes
        }));

        // API rate limiter
        this.rateLimiters.set('api', new rateLimiter.RateLimiterMemory({
            keyPrefix: 'api',
            points: 100, // 100 requests
            duration: 900, // per 15 minutes
        }));

        // File upload rate limiter
        this.rateLimiters.set('upload', new rateLimit.RateLimiterMemory({
            keyPrefix: 'upload',
            points: 10, // 10 uploads
            duration: 3600, // per hour
        }));

        // Chat rate limiter
        this.rateLimiters.set('chat', new rateLimit.RateLimiterMemory({
            keyPrefix: 'chat',
            points: 60, // 60 messages
            duration: 60, // per minute
        }));
    }

    async loadBlacklist() {
        // Load blacklisted IPs and tokens
        // This would typically load from database
        console.log('لیست سیاه بارگذاری شد');
    }

    // Password hashing
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // JWT token management
    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('توکن نامعتبر است');
        }
    }

    generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    // Rate limiting
    async checkRateLimit(type, identifier) {
        const limiter = this.rateLimiters.get(type);
        if (!limiter) {
            throw new Error('نوع محدودیت نرخ یافت نشد');
        }

        try {
            await limiter.consume(identifier);
            return { allowed: true };
        } catch (rejRes) {
            return {
                allowed: false,
                remainingPoints: rejRes.remainingPoints,
                msBeforeNext: rejRes.msBeforeNext
            };
        }
    }

    // IP blocking
    isIPBlocked(ip) {
        return this.blacklist.has(ip);
    }

    blockIP(ip, reason = 'Suspicious activity') {
        this.blacklist.add(ip);
        console.log(`IP ${ip} مسدود شد: ${reason}`);
    }

    unblockIP(ip) {
        this.blacklist.delete(ip);
        console.log(`IP ${ip} از مسدودی خارج شد`);
    }

    // Failed login attempts
    recordFailedAttempt(ip) {
        const attempts = this.failedAttempts.get(ip) || 0;
        this.failedAttempts.set(ip, attempts + 1);

        if (attempts + 1 >= this.maxFailedAttempts) {
            this.blockIP(ip, 'Too many failed login attempts');
            return { blocked: true, message: 'IP مسدود شد' };
        }

        return {
            blocked: false,
            attempts: attempts + 1,
            remaining: this.maxFailedAttempts - (attempts + 1)
        };
    }

    resetFailedAttempts(ip) {
        this.failedAttempts.delete(ip);
    }

    // Input validation and sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .replace(/[;]/g, '') // Remove semicolons
            .trim();
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // File security
    validateFileType(filename, allowedTypes = []) {
        const extension = filename.split('.').pop().toLowerCase();
        return allowedTypes.includes(extension);
    }

    validateFileSize(size, maxSize = 10 * 1024 * 1024) { // 10MB default
        return size <= maxSize;
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    // Encryption/Decryption
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encrypted = textParts.join(':');
        
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Session management
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    // CSRF protection
    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    verifyCSRFToken(token, sessionToken) {
        return token === sessionToken;
    }

    // SQL injection prevention
    escapeSQL(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/'/g, "''")
            .replace(/;/g, '')
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '');
    }

    // XSS prevention
    escapeHTML(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Security headers
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        };
    }

    // Audit logging
    logSecurityEvent(event, details, ip, userId = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            ip: ip,
            userId: userId,
            severity: this.getEventSeverity(event)
        };

        console.log('Security Event:', logEntry);
        
        // In production, this would be saved to a secure log file or database
        return logEntry;
    }

    getEventSeverity(event) {
        const severityMap = {
            'login_success': 'info',
            'login_failed': 'warning',
            'ip_blocked': 'error',
            'rate_limit_exceeded': 'warning',
            'suspicious_activity': 'error',
            'file_upload': 'info',
            'admin_action': 'info'
        };
        
        return severityMap[event] || 'info';
    }

    // Security scan
    async performSecurityScan() {
        const scanResults = {
            timestamp: new Date().toISOString(),
            checks: []
        };

        // Check for weak passwords in database
        // Check for suspicious activity
        // Check for outdated dependencies
        // Check file permissions
        // Check for exposed secrets

        return scanResults;
    }

    // Cleanup
    cleanup() {
        // Clear failed attempts older than lockout duration
        const now = Date.now();
        for (const [ip, timestamp] of this.failedAttempts.entries()) {
            if (now - timestamp > this.lockoutDuration) {
                this.failedAttempts.delete(ip);
            }
        }
    }
}

module.exports = SecurityManager;