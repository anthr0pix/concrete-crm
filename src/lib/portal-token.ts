import { SignJWT, jwtVerify } from "jose";

type PortalPayload =
  | { type: "quote"; id: string }
  | { type: "invoice"; id: string };

function getSecret(): Uint8Array {
  const secret = process.env.PORTAL_JWT_SECRET;
  if (!secret) throw new Error("PORTAL_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signPortalToken(payload: PortalPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyPortalToken(token: string): Promise<PortalPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  if (!payload.type || !payload.id) {
    throw new Error("Invalid portal token");
  }
  return payload as unknown as PortalPayload;
}
