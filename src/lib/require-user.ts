import "server-only";
import { auth } from "@/lib/auth";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht angemeldet.");
  }
  return session.user.id;
}
