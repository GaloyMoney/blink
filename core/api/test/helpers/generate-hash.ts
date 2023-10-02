import { createHash, randomBytes } from "crypto"

export const generateHash = () => {
  const sha256 = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex")
  return sha256(randomBytes(32))
}
