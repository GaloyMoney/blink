import { createPrivateKey, createPublicKey } from "crypto"

/**
 * Extracts a public key in PEM format from a private key
 * @param privateKeyPem - Private key in PEM format as string or Buffer
 * @returns The public key in PEM format or null if extraction fails
 * @throws Error if the input cannot be processed as a private key
 */
export const getPublicKey = (privateKeyPem: string | Buffer): string | null => {
  if (!privateKeyPem) {
    return null
  }

  try {
    const privateKeyObject = createPrivateKey({
      key: privateKeyPem,
      format: "pem",
    })

    return createPublicKey(privateKeyObject)
      .export({ format: "pem", type: "spki" })
      .toString()
  } catch {
    return null
  }
}

/**
 * Extracts the telegram bot ID from a token
 * @param token - The token string to parse
 * @returns The extracted bot ID or null if the token is invalid
 */
export const getBotIdFromToken = (token: string): string | null => {
  if (!token || typeof token !== "string") {
    return null
  }

  const parts = token.split(":")

  if (parts.length < 2 || !parts[0]) {
    return null
  }

  return parts[0]
}
