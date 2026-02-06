const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads/profiles');
const SALON_UPLOAD_DIR = path.join(__dirname, '../uploads/salons');

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(SALON_UPLOAD_DIR)) {
    fs.mkdirSync(SALON_UPLOAD_DIR, { recursive: true });
}

// Memory storage for sharp processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Nem támogatott fájlformátum. Csak JPG, PNG és WebP fájlok engedélyezettek.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Process image with sharp and save to disk
async function processAndSaveImage(buffer, prefix, id) {
    const filename = `${prefix}-${id}-${Date.now()}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

    return `/uploads/profiles/${filename}`;
}

// Delete old profile picture from disk
function deleteOldImage(imageUrl) {
    if (!imageUrl) return;
    try {
        const filename = path.basename(imageUrl);
        const filepath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (err) {
        console.error('Error deleting old image:', err);
    }
}

// Process salon logo with sharp (200x200 square)
async function processSalonLogo(buffer, salonId) {
    const filename = `logo-${salonId}-${Date.now()}.jpg`;
    const filepath = path.join(SALON_UPLOAD_DIR, filename);

    await sharp(buffer)
        .resize(200, 200, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

    return `/uploads/salons/${filename}`;
}

// Process salon banner with sharp (1200x300)
async function processSalonBanner(buffer, salonId) {
    const filename = `banner-${salonId}-${Date.now()}.jpg`;
    const filepath = path.join(SALON_UPLOAD_DIR, filename);

    await sharp(buffer)
        .resize(1200, 300, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(filepath);

    return `/uploads/salons/${filename}`;
}

// Delete old salon image from disk
function deleteOldSalonImage(imageUrl) {
    if (!imageUrl) return;
    try {
        const filename = path.basename(imageUrl);
        const filepath = path.join(SALON_UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (err) {
        console.error('Error deleting old salon image:', err);
    }
}

module.exports = { upload, processAndSaveImage, deleteOldImage, processSalonLogo, processSalonBanner, deleteOldSalonImage };
