import { z } from "zod";

export const createNewsPostSchema = z.object({
  title: z
    .string()
    .min(3, { message: "O título precisa ter no mínimo 3 caracteres." }),
  content: z
    .string()
    .min(10, { message: "O conteúdo precisa ter no mínimo 10 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória." }),
  imageUrl: z
    .string()
    .url({ message: "Por favor, insira uma URL de imagem inválida." })
    .optional()
    .or(z.literal("")),
});

export const updateNewsPostSchema = createNewsPostSchema.partial();

export type CreateNewsPostInput = z.infer<typeof createNewsPostSchema>;
export type UpdateNewsPostInput = z.infer<typeof updateNewsPostSchema>;
