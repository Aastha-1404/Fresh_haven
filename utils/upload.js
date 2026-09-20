const multer = require('multer');
const path = require('path');

// Store uploaded listing images in the public directory so Express can serve them.
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        callback(null, uniqueName);
    },
});

// Accept only common image formats and keep individual files below 5 MB.
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
        }
        callback(null, true);
    },
});

module.exports = upload;
