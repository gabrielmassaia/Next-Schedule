import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    // Preserve error messages for better debugging
    if (error instanceof Error) {
      return error.message;
    }
    return "Erro desconhecido ao executar a operação";
  },
});
