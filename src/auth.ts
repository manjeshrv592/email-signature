import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            authorization: {
                params: {
                    scope: "openid profile email User.Read",
                },
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ account, profile }) {
            if (!account || !profile) return false;

            const allowedEmails = (process.env.ADMIN_EMAIL || "")
                .split(",")
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

            const userEmail = (profile.email ?? "").toLowerCase();

            if (allowedEmails.length === 0 || !allowedEmails.includes(userEmail)) {
                return false;
            }

            return true;
        },

        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.email = profile.email;
            }
            return token;
        },

        async session({ session, token }) {
            return session;
        },
    },
});
