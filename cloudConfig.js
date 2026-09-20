const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'fresh_haven',
        allowedFormats: ['jpeg', 'png', 'jpg', 'webp', 'gif']
    }
});

module.exports = {
    cloudinary,
    storage
};