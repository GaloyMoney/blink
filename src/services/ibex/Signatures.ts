import crypto from "crypto"

function isValidSignature(
  signature: string | string[] | undefined,
  payload: unknown,
  secret: string,
): boolean {
  // Depending on the service's method of signing, generate a signature on your end
  const expectedSignature = generateSignature(payload, secret)
  return signature === expectedSignature
}

function generateSignature(data: unknown, secret: string): string {
  // This is an example using HMAC and SHA256. The exact method depends on the service's documentation.
  return crypto.createHmac("sha256", secret).update(JSON.stringify(data)).digest("hex")
}

export default isValidSignature
