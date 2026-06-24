import fs from 'fs';
import path from 'path';
import multer from 'multer';

export const uploadsRoot = path.join(process.cwd(), 'uploads');
export const taskAttachmentsUploadDirectory = path.join(uploadsRoot, 'task-attachments');

if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot);
}

if (!fs.existsSync(taskAttachmentsUploadDirectory)) {
    fs.mkdirSync(taskAttachmentsUploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, taskAttachmentsUploadDirectory);
    },
    filename: (_req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname);
        const safeName = path
            .basename(file.originalname, extension)
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-_]/g, '');

        callback(null, `${file.fieldname}-${safeName}-${uniqueSuffix}${extension}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});