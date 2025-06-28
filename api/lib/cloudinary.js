import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();
console.log('[Cloudinary Config] cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[Cloudinary Config] api_key:', process.env.CLOUDINARY_API_KEY ? '***set***' : '***missing***');
console.log('[Cloudinary Config] api_secret:', process.env.CLOUDINARY_API_SECRET ? '***set***' : '***missing***');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
