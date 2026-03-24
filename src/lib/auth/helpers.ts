import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export async function getCurrentSession() {
    const session = await auth();
    return session;
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Returns the session if authenticated.
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }
    return session;
}
