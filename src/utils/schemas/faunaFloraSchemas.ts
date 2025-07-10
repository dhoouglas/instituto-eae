import { z } from "zod";

const baseSchema = z.object({
  name: z.string().min(3, "O nome popular é obrigatório."),
  scientificName: z.string().min(3, "O nome científico é obrigatório."),
  description: z.string().min(10, "A descrição é obrigatória."),
});

const faunaSchema = baseSchema.extend({
  type: z.literal("FAUNA"),
  habitat: z.string().min(3, "O habitat é obrigatório."),
  conservationStatus: z.enum(["POUCO_PREOCUPANTE", "AMEACADA", "EXTINTA"], {
    errorMap: () => ({
      message: "Selecione o estado de conservação.",
    }),
  }),
});

const floraSchema = baseSchema.extend({
  type: z.literal("FLORA"),
  family: z.string().min(3, "A família é obrigatória."),
  conservationStatus: z
    .enum([
      "POUCO_PREOCUPANTE",
      "AMEACADA",
      "EXTINTA",
      "NAO_APLICAVEL",
      "Status de Conservação",
    ])
    .optional(),
});

export const faunaFloraSchema = z.discriminatedUnion("type", [
  faunaSchema,
  floraSchema,
]);
