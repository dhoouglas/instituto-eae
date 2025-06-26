import z from "zod";

export const createFaunaFloraSchema = z.object({
  popularName: z.string().min(3, { message: "O nome popular é obrigatório." }),
  scientificName: z
    .string()
    .min(3, { message: "O nome científico é obrigatório." }),
  type: z.enum(["fauna", "flora"], {
    errorMap: () => ({ message: "Selecione se é fauna ou flora." }),
  }),
  description: z
    .string()
    .min(10, { message: "A descrição precisa ter no mínimo 10 caracteres." }),
});
