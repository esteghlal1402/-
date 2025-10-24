/**
 * روت‌های احراز هویت
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock user database (in production, use real database)
const users = new Map();

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'تمام فیلدها الزامی است',
                required: ['username', 'email', 'password', 'firstName', 'lastName']
            });
        }

        // Check if user already exists
        if (users.has(username) || users.has(email)) {
            return res.status(409).json({
                error: 'کاربر با این نام کاربری یا ایمیل قبلاً ثبت شده است'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.set(username, user);
        users.set(email, user);

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'کاربر با موفقیت ثبت شد',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            token: token
        });

    } catch (error) {
        console.error('خطا در ثبت نام:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'نام کاربری و رمز عبور الزامی است'
            });
        }

        // Find user
        const user = users.get(username) || users.get(username);
        if (!user) {
            return res.status(401).json({
                error: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'حساب کاربری غیرفعال است'
            });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'ورود موفقیت‌آمیز',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                lastLogin: user.lastLogin
            },
            token: token
        });

    } catch (error) {
        console.error('خطا در ورود:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    // In production, you would add the token to a blacklist
    res.json({
        message: 'خروج موفقیت‌آمیز'
    });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    const user = users.get(req.user.username);
    if (!user) {
        return res.status(404).json({
            error: 'کاربر یافت نشد'
        });
    }

    res.json({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        }
    });
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'رمز عبور فعلی و جدید الزامی است'
            });
        }

        const user = users.get(req.user.username);
        if (!user) {
            return res.status(404).json({
                error: 'کاربر یافت نشد'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'رمز عبور فعلی اشتباه است'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;

        res.json({
            message: 'رمز عبور با موفقیت تغییر کرد'
        });

    } catch (error) {
        console.error('خطا در تغییر رمز عبور:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'توکن احراز هویت الزامی است'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'توکن نامعتبر است'
            });
        }
        req.user = user;
        next();
    });
}

module.exports = router;