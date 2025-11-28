import { useMutation } from "@tanstack/react-query";
import axios from "axios";

type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailResponse = {
  success: boolean;
  data?: string;
  error?: {
    code: string;
    message: string;
  };
};

export function useSendEmail() {
  return useMutation({
    mutationFn: async (payload: SendEmailPayload) => {
      const response = await axios.post<SendEmailResponse>(
        "/api/email/send",
        payload,
      );
      return response.data;
    },
  });
}
