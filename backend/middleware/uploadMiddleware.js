import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from 'cloudinary'
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "quiz-pdfs", resource_type: "raw" },
});

// module.exports = multer({ storage });

export default multer({storage})