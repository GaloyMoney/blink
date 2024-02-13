export const serverUrl =
  process.env.SERVER_URL ?? "https://fe69-93-108-186-220.ngrok-free.app"

export const coreUrl = process.env.CORE_URL ?? "http://localhost:4002/graphql"

export const AES_DECRYPT_KEY =
  process.env.AES_DECRYPT_KEY ?? "0c3b25d92b38ae443229dd59ad34b85d"

export const aesDecryptKey = Buffer.from(AES_DECRYPT_KEY, "hex")

export const lightningDomain = process.env.LIGHTNING_DOMAIN ?? "localhost"

export const isAdmin = true
