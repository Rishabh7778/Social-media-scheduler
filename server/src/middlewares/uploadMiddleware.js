import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// 1. Cloudinary ko apne credentials dena
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Storage Setup (Kahan aur kaise save karna hai)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_scheduler', // Cloudinary ke andar is folder mein images jayengi
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Sirf images allow karenge
  },
});

// 3. Multer Middleware Export karna
export const upload = multer({ storage });