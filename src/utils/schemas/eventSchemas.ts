import z from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, { message: "O título precisa ter no mínimo 3 caracteres." }),
  date: z.string().min(1, { message: "A data é obrigatória." }),
  location: z.string().min(3, { message: "A localização é obrigatória." }),
  description: z
    .string()
    .min(10, { message: "A descrição precisa ter no mínimo 10 caracteres." }),
});
