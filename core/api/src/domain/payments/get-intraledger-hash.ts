import { createHash, randomBytes } from "crypto"

const sha256 = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex")

export const generateIntraLedgerHash = (): IntraLedgerHash =>
  sha256(randomBytes(32)) as IntraLedgerHash
