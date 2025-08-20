"use server";

import { symmetricDecrypt } from "@/lib/credential";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getCredentialValue(credentialName: string): Promise<string | null> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const credential = await prisma.credential.findUnique({
    where: {
      userId_name: {
        userId,
        name: credentialName,
      },
    },
  });

  if (!credential) {
    return null;
  }

  try {
    return symmetricDecrypt(credential.value);
  } catch (error) {
    console.error("Error decrypting credential:", error);
    throw new Error("Failed to decrypt credential");
  }
}

export async function getOpenRouterApiKey(): Promise<string | null> {
  return getCredentialValue("OpenRouter");
}
