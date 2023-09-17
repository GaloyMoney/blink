const aesjs = require("aes-js")

export const decryptedPToUidCtr = (
  decryptedP: Uint8Array,
): { uid: string; uidRaw: Uint8Array; ctr: number; ctrRawInverseBytes: Uint8Array } => {
  if (decryptedP[0] !== 0xc7) {
    throw new Error("data not starting with 0xC7")
  }

  const uidRaw = decryptedP.slice(1, 8)
  const uid = aesjs.utils.hex.fromBytes(uidRaw)

  const ctrRawInverseBytes = decryptedP.slice(8, 11)
  const ctr =
    (ctrRawInverseBytes[2] << 16) | (ctrRawInverseBytes[1] << 8) | ctrRawInverseBytes[0]

  return {
    uid,
    uidRaw,
    ctr,
    ctrRawInverseBytes,
  }
}
