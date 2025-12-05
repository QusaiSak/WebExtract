import { z } from "zod";

export const createCredentialSchema = z.object({
  name: z.string().max(30).nonempty(),
  value: z.string().max(1000).nonempty(),
});

export type createCredentialSchemaType = z.infer<typeof createCredentialSchema>;
