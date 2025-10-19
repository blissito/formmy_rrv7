/**
 * Upload Service - Manejo temporal de archivos para LlamaParse
 *
 * Estrategia de limpieza:
 * 1. Upload a S3 con prefix "parser-temp/"
 * 2. Delete inmediato después de parsing exitoso
 * 3. Lifecycle policy de backup: auto-delete a 24h
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.BUCKET_NAME || "formmy-public";
const PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || "https://formmy-public.fly.storage.tigris.dev";

interface UploadResult {
  fileKey: string;
  publicUrl: string;
}

/**
 * Upload archivo temporal a S3 para LlamaParse
 * Prefix: parser-temp/{jobId}/{fileName}
 */
export async function uploadParserFile(
  fileBuffer: Buffer,
  fileName: string,
  jobId: string,
  fileType: string
): Promise<UploadResult> {
  try {
    // Generar key único con prefix temporal
    const timestamp = Date.now();
    const fileKey = `parser-temp/${jobId}/${timestamp}-${fileName}`;

    // Upload a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: fileType,
        Metadata: {
          "x-amz-meta-job-id": jobId,
          "x-amz-meta-created": new Date().toISOString(),
          "x-amz-meta-expires": new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        },
      })
    );

    // Generar URL pública
    const publicUrl = `${PUBLIC_ENDPOINT}/${fileKey}`;

    console.log(`✅ Archivo subido a S3: ${fileKey}`);

    return { fileKey, publicUrl };
  } catch (error) {
    console.error("❌ Error uploading file to S3:", error);
    throw new Error(`Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Eliminar archivo temporal de S3 después de parsing
 */
export async function deleteParserFile(fileKey: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      })
    );

    console.log(`🗑️ Archivo eliminado de S3: ${fileKey}`);
  } catch (error) {
    // No lanzar error, solo logear (lifecycle policy lo limpiará)
    console.error("⚠️ Error deleting file from S3 (will be auto-deleted in 24h):", error);
  }
}

/**
 * Extraer fileKey de una URL pública de S3
 */
export function extractKeyFromUrl(publicUrl: string): string {
  try {
    const url = new URL(publicUrl);
    // Eliminar el "/" inicial del pathname
    return url.pathname.substring(1);
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    throw new Error("Invalid S3 URL");
  }
}
