export const serverUrl = process.env.SERVER_URL ?? "http://localhost:3000"

export const apiUrl = process.env.API_URL ?? "http://localhost:4002/graphql"

export const AES_DECRYPT_KEY =
  process.env.AES_DECRYPT_KEY ?? "0c3b25d92b38ae443229dd59ad34b85d"

export const aesDecryptKey = Buffer.from(AES_DECRYPT_KEY, "hex")
