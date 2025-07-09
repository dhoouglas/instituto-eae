import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";

export function useStorage() {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
      if (!asset) return null;

      setIsUploading(true);
      try {
        const token = await getToken({ template: "api-testing-token" });
        if (!token) {
          throw new Error("Token de autenticação não encontrado.");
        }

        const formData = new FormData();

        const fileData = {
          uri: asset.uri,
          name: asset.fileName ?? "image.jpg",
          type: asset.mimeType ?? "image/jpeg",
        } as any;

        formData.append("file", fileData);

        const response = await api.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data.url;
      } catch (error) {
        console.error("Erro no upload da imagem via API:", error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [getToken]
  );

  return { uploadImage, isUploading };
}
