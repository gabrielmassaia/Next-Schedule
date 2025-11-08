import { z } from "zod";

export const deactivateClientSchema = z.object({
  id: z.string().uuid(),
});
