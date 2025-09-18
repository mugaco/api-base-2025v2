import { Options } from 'multer';

export const multerConfig: Options = {
  limits: {
    fileSize: 100 * 1024 * 1024, // 10 megabytes en bytes
  },
  fileFilter: (req, file, callback) => {
    // Normalize the original filename to properly handle UTF-8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    file.originalname = originalName;
    callback(null, true);
  }
};
export const maxMultifileUpload = 3;