/**
 * روت‌های مدیریت فایل
 * File Management Routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for now
        cb(null, true);
    }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'فایل الزامی است'
            });
        }

        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedAt: new Date().toISOString()
        };

        res.json({
            message: 'فایل با موفقیت آپلود شد',
            file: fileData
        });

    } catch (error) {
        console.error('خطا در آپلود فایل:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Get file info
router.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads', filename);

        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({
                error: 'فایل یافت نشد'
            });
        }

        const stats = await fs.stat(filePath);
        const fileData = {
            filename: filename,
            size: stats.size,
            mimeType: 'application/octet-stream', // You might want to detect this
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };

        res.json({
            file: fileData
        });

    } catch (error) {
        console.error('خطا در دریافت اطلاعات فایل:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Download file
router.get('/download/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads', filename);

        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({
                error: 'فایل یافت نشد'
            });
        }

        res.download(filePath, filename);

    } catch (error) {
        console.error('خطا در دانلود فایل:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// Delete file
router.delete('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads', filename);

        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({
                error: 'فایل یافت نشد'
            });
        }

        await fs.remove(filePath);

        res.json({
            message: 'فایل با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('خطا در حذف فایل:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

// List files
router.get('/', async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../../uploads');
        const files = await fs.readdir(uploadDir);
        
        const fileList = [];
        for (const file of files) {
            const filePath = path.join(uploadDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
                fileList.push({
                    filename: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }
        }

        res.json({
            files: fileList,
            count: fileList.length
        });

    } catch (error) {
        console.error('خطا در لیست فایل‌ها:', error);
        res.status(500).json({
            error: 'خطای داخلی سرور'
        });
    }
});

module.exports = router;