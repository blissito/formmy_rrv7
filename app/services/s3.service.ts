import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
};

export async function generatePresignedUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  
  return {
    uploadUrl: url,
    publicUrl: `${process.env.S3_PUBLIC_ENDPOINT}/${key}`,
    key,
  };
}

export function generateKey(filename: string, prefix: string = "chatbot-avatars", slug?: string) {
  const timestamp = Date.now();
  const extension = filename.split(".").pop();
  
  if (slug) {
    // Para avatares de chatbot, usar solo el slug sin extensión para permitir sobreescritura entre formatos
    if (prefix === "chatbot-avatars") {
      return `${prefix}/${slug}`;
    }
    // Para otros tipos de archivos, mantener ID único
    return `${prefix}/${slug}-${timestamp}.${extension}`;
  }
  
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}/${timestamp}-${randomStr}.${extension}`;
}