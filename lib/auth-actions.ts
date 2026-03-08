"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { authUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export async function credentialsSignIn(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email:       formData.get("email"),
      password:    formData.get("password"),
      redirectTo:  formData.get("callbackUrl") as string ?? "/",
    });
  } catch (e) {
    // NextAuth throws a redirect on success — re-throw it
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (e instanceof AuthError) return "Incorrect email or password.";
    throw e;
  }
  // Never reached — signIn always throws a redirect on success
  return null;
}

export async function registerAndSignIn(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name     = (formData.get("name") as string | null)?.trim() || null;

  if (!email || !password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  const existing = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    return "An account with this email already exists.";
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(authUsers).values({ email, password: hashed, name });

  // Sign in immediately after registering
  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (e instanceof AuthError) return "Account created but sign-in failed. Please sign in manually.";
    throw e;
  }

  return null;
}
