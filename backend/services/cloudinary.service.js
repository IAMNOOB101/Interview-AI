import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadPDFToCloudinary = async (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "interviewai/resumes",
        resource_type: "raw",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteCloudinaryFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { type: "upload", resource_type: "raw" });
  } catch (err) {
    console.error("Error deleting file from Cloudinary:", err);
  }
};

