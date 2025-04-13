import { createPrivateKey, createPublicKey } from "crypto"

export const getPublicKey = (privateKeyPem: string | Buffer) => {
  try {
    const privateKeyObject = createPrivateKey({
      key: privateKeyPem,
      format: "pem",
    })

    const publicKeyObject = createPublicKey(privateKeyObject)

    return publicKeyObject
      .export({
        format: "pem",
        type: "spki", // Standard format for public keys
      })
      .toString()
  } catch {
    return ""
  }
}

export const getBotIdFromToken = (token: string) => {
  if (!token) {
    return ""
  }

  const parts = token.split(":")

  if (parts.length < 2 || !parts[0]) {
    return ""
  }

  return parts[0]
}
