import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

const UPLOAD_DIR = path.resolve("uploads");

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Upload multer files to Cloudinary (Promise API only — no callback race).
 */
export async function uploadFilesToCloudinary(files = []) {
  if (!files?.length) {
    return [];
  }

  if (
    !process.env.cloudinary_Config_Cloud_Name ||
    !process.env.cloudinary_Config_api_key ||
    !process.env.cloudinary_Config_api_secret
  ) {
    throw new Error(
      "Cloudinary chưa được cấu hình. Kiểm tra biến môi trường cloudinary_Config_* trong file .env"
    );
  }

  const urls = [];
  const options = {
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  for (const file of files) {
    if (!file?.path) continue;

    try {
      const result = await cloudinary.uploader.upload(file.path, options);
      if (!result?.secure_url) {
        throw new Error("Cloudinary không trả về URL ảnh");
      }
      urls.push(result.secure_url);
    } finally {
      safeUnlink(file.path);
    }
  }

  return urls;
}

export { cloudinary };
