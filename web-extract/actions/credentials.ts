"use server";

import { symmetricEncrypt } from "@/lib/credential";
import prisma from "@/lib/prisma";
import {
  createCredentialSchema,
  createCredentialSchemaType,
} from "@/schema/credential";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getUserCredentials() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return await prisma.credential.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createCredential(form: createCredentialSchemaType) {
  const { success, data } = createCredentialSchema.safeParse(form);

  if (!success) {
    return { success: false, error: "Invalid form data" };
  }

  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthenticated" };
  }

  try {
    const encryptedValue = symmetricEncrypt(data.value);

    const result = await prisma.credential.create({
      data: {
        userId,
        name: data.name,
        value: encryptedValue,
      },
    });

    if (!result) {
      return { success: false, error: "Failed to create credential" };
    }
    revalidatePath("/dashboard/credentials");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Credential with this name already exists" };
    }
    return { success: false, error: error.message || "Failed to create credential" };
  }
}

export async function deleteCredential(id: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthenticated" };
  }
  
  try {
    await prisma.credential.deleteMany({
      where: {
        userId,
        id,
      },
    });

    revalidatePath("/dashboard/credentials");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete credential:", error);
    return { success: false, error: error.message || "Failed to delete credential" };
  }
}