import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary environment variables are missing in backend .env");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quiz-documents",
    resource_type: "raw",
  },
});

const allowedExtensions = [".pdf", ".txt", ".doc", ".docx", ".ppt", ".pptx"];

const fileFilter = (_req, file, cb) => {
  const filename = String(file.originalname || "").toLowerCase();
  const isAllowed = allowedExtensions.some((ext) => filename.endsWith(ext));

  if (!isAllowed) {
    cb(
      new Error(
        "Unsupported file type. Please upload PDF, TXT, Word (.doc/.docx), or PowerPoint (.ppt/.pptx) files only.",
      ),
      false,
    );
    return;
  }

  cb(null, true);
};

const limits = { fileSize: 20 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });
export default upload;
