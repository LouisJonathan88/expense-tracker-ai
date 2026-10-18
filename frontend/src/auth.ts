import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Ambil waktu kedaluwarsa (ms) dari klaim exp pada JWT backend
function tokenExpiry(accessToken: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account }) {
      // `account` hanya terisi saat login pertama kali
      if (account?.id_token) {
        try {
          const res = await fetch(`${process.env.API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.accessTokenExpires = tokenExpiry(data.access_token);
          } else {
            console.error("Gagal menukar token Google ke backend:", res.status);
          }
        } catch (err) {
          console.error("Backend tidak bisa dihubungi:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      const expires = token.accessTokenExpires as number | undefined;
      const stillValid =
        typeof token.accessToken === "string" &&
        typeof expires === "number" &&
        Date.now() < expires;

      session.accessToken = stillValid ? (token.accessToken as string) : undefined;
      return session;
    },
  },
});