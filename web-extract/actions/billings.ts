"use server";

import { getCreditsPack, PackId } from "@/lib/billing";
import { getAppUrl } from "@/lib/helper";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe/stripe";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function InitializeUserBalance() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return 0;
    }

    // Check if user balance already exists
    const existingBalance = await prisma.userBalance?.findUnique?.({
      where: {
        userId,
      },
    });

    if (existingBalance) {
      return existingBalance.credits || 0;
    }

    // Create initial balance for new user
    const newBalance = await prisma.userBalance?.create?.({
      data: {
        userId,
        credits: 1000, // Give new users 1000 credits
      },
    });

    return newBalance?.credits || 0;
  } catch (error) {
    return 0;
  }
}

export async function getAvailableCredits() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return 0;
    }

    const balance = await prisma.userBalance?.findUnique?.({
      where: {
        userId,
      },
    });

    return balance?.credits || 0;
  } catch (error) {
    return 0;
  }
}

export async function setupUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect("/");
      return;
    }

    const userBalance = await prisma.userBalance?.findUnique?.({
      where: {
        userId,
      },
    });

    if (!userBalance) {
      await prisma.userBalance?.create?.({
        data: {
          userId,
          credits: 200,
        },
      });
    }

    redirect("/home");
  } catch (error) {
    redirect("/");
  }
}

export async function purchaseCredits(packId: PackId) {
  try {
    console.log('purchaseCredits called with packId:', packId)
    
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthenticated");
    }

    console.log('User ID:', userId)

    const seletedPack = getCreditsPack(packId);

    if (!seletedPack) {
      throw new Error("Invalid package");
    }

    console.log('Selected pack:', seletedPack)

    const priceId = seletedPack?.priceId;

    console.log('Creating Stripe session with priceId:', priceId)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      invoice_creation: {
        enabled: true,
      },
      success_url: getAppUrl("dashboard/billing"), // ✅ Correct
      cancel_url: getAppUrl("dashboard/billing"),  // ✅ Correct

      // adding custom details to session info via metadata
      metadata: {
        userId,
        packId,
      },
      line_items: [
        {
          quantity: 1,
          price: priceId, // here price refer to priceId from stripe
        },
      ],
    });

    console.log('Stripe session created:', session.id, 'URL:', session.url)

    if (!session.url) {
      throw new Error("Cannot create stripe session");
    }

    return { url: session.url, success: true };
  } catch (error) {
    console.error('Error in purchaseCredits:', error)
    throw error; // Let the client handle the error
  }
}

export async function getUserPurchases() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    const purchases = await prisma.userPurchase?.findMany?.({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return purchases || [];
  } catch (error) {
    return [];
  }
}

export async function downloadInvoice(id: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const purchase = await prisma.userPurchase?.findUnique?.({
      where: {
        id,
        userId,
      },
    });

    if (!purchase) {
      return null;
    }

    const session = await stripe.checkout.sessions.retrieve(purchase.stripeId);
    if (!session.invoice) {
      return null;
    }

    const invoice = await stripe.invoices.retrieve(session.invoice as string);
    return invoice.hosted_invoice_url || null;
  } catch (error) {
    return null;
  }
}