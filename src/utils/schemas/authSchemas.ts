import { z } from "zod";

// Esquema para o formulário de Login
export const signInSchema = z.object({
  email: z
    .string()
    .email({ message: "Por favor, insira um endereço de e-mail válido." }),
  password: z.string().min(1, { message: "Por favor, insira sua senha." }),
});

// Esquema para o formulário de Cadastro
export const signUpSchema = z
  .object({
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    password: z
      .string()
      .min(8, { message: "A senha precisa ter no mínimo 8 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"], // Indica qual campo está com o erro
  });

// Esquema para solicitar a redefinição de senha
export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .email({ message: "Por favor, insira um e-mail válido para continuar." }),
});

// Esquema para confirmar a nova senha
export const forgotPasswordResetSchema = z.object({
  code: z.string().min(6, { message: "O código precisa ter 6 dígitos." }),
  newPassword: z
    .string()
    .min(8, { message: "A nova senha precisa ter no mínimo 8 caracteres." }),
});

// Esquema para criar uma nova senha (usuários de contas sociais)
export const createPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

// Esquema para atualizar o perfil do usuário
export const updateUserSchema = z.object({
  firstName: z.string().min(1, { message: "O nome é obrigatório." }),
  lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
});

// Esquema para alterar a senha existente
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Por favor, insira sua senha atual." }),
    newPassword: z
      .string()
      .min(8, { message: "A nova senha deve ter no mínimo 8 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
