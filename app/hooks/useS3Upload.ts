import { useState } from "react";

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadResult {
  publicUrl: string;
  key: string;
}

export function useS3Upload() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = async (
    file: File,
    prefix: string = "chatbot-avatars",
    slug?: string
  ): Promise<UploadResult | null> => {
    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      // Step 0: Delete old avatars if this is a chatbot avatar upload
      if (prefix === "chatbot-avatars" && slug) {
        const deleteFormData = new FormData();
        deleteFormData.append("slug", slug);
        
        await fetch("/api/s3/delete-old-avatars", {
          method: "POST",
          body: deleteFormData,
        });
      }

      // Step 1: Get presigned URL
      const formData = new FormData();
      formData.append("filename", file.name);
      formData.append("contentType", file.type);
      formData.append("prefix", prefix);
      if (slug) {
        formData.append("slug", slug);
      }

      const presignedResponse = await fetch("/api/s3/presigned-url", {
        method: "POST",
        body: formData,
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { uploadUrl, publicUrl, key } = await presignedResponse.json();

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      setUploadState({ isUploading: false, progress: 100, error: null });
      
      return { publicUrl, key };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadState({ isUploading: false, progress: 0, error: errorMessage });
      console.error("Upload error:", error);
      return null;
    }
  };

  const reset = () => {
    setUploadState({ isUploading: false, progress: 0, error: null });
  };

  return {
    uploadFile,
    uploadState,
    reset,
  };
}