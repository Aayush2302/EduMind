import multer from 'multer';

export const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    console.log("File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (file.mimetype !== "application/pdf") {
      console.error("Invalid file type:", file.mimetype);
      return cb(new Error("Only PDF files are allowed"));
    }
    
    cb(null, true);
  },
});