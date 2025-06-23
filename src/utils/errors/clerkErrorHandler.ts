// Local: src/utils/errors/clerkErrorHandler.ts

const clerkErrorMap: { [key: string]: string } = {
  form_param_nil: "Por favor, preencha todos os campos obrigatórios.",
  form_password_pwned:
    "Esta senha é muito comum ou já foi comprometida. Por segurança, por favor, escolha uma senha mais forte e única.",
  sign_up_duplicate_email:
    "Este endereço de e-mail já está em uso. Tente fazer login ou use um e-mail diferente.",
  form_password_length_too_short:
    "Sua senha precisa ter no mínimo 8 caracteres.",
};

export function handleClerkError(error: any): string {
  const defaultErrorMessage =
    "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.";
  const firstError = error?.errors?.[0];

  if (!firstError) {
    return defaultErrorMessage;
  }

  const genericAuthErrorMessage =
    "E-mail ou senha inválidos. Por favor, verifique seus dados e tente novamente.";

  const authErrorCodes = [
    "form_password_incorrect",
    "form_identifier_not_found",
  ];

  if (authErrorCodes.includes(firstError.code)) {
    return genericAuthErrorMessage;
  }

  const translatedMessage =
    clerkErrorMap[firstError.code] ||
    firstError.longMessage ||
    defaultErrorMessage;

  console.log(`Clerk Error Code: ${firstError.code}`);

  return translatedMessage;
}
