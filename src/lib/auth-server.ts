import { createRemoteJWKSet, jwtVerify } from "jose";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

// Cached JWKS fetched from Privy's public endpoint — no app secret needed.
const JWKS = createRemoteJWKSet(
  new URL(`https://auth.privy.io/api/v1/apps/${APP_ID}/jwks.json`)
);

/**
 * Verifies the Privy access token in the Authorization header.
 * Returns the user's Privy DID (e.g. "did:privy:...") on success, null otherwise.
 */
export async function requireAuth(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "privy.io",
      audience: APP_ID,
    });
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}
