import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const checks: any = {};

  // Check Env
  checks.env = {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? "Present" : "Missing",
    DATABASE_URL: process.env.DATABASE_URL ? "Present" : "Missing",
  };

  // Check Auth
  try {
    const { userId } = await auth();
    checks.auth = {
      userId: userId || "Null",
    };
  } catch (e: any) {
    checks.auth = {
      error: e.message,
    };
  }

  // Check DB
  try {
    await prisma.$connect();
    checks.db = "Connected";
  } catch (e: any) {
    checks.db = {
      error: e.message,
    };
  }

  return NextResponse.json(checks);
}
