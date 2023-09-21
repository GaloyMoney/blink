const aesjs = require("aes-js")

// used for encryption
export const decodePToUidCtr = (
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

// only used to simulate the cold card
export const encodeUidCtrToP = (uid: Buffer, ctr: Buffer): Uint8Array => {
  return new Uint8Array([
    0xc7,
    uid[0],
    uid[1],
    uid[2],
    uid[3],
    uid[4],
    uid[5],
    uid[6],
    ctr[0],
    ctr[1],
    ctr[2],

    // those value can be random, but they are set as is so that
    // tests pass for the simulation of the encryption for the coldcard
    2,
    63,
    181,
    243,
    74,
  ])
}

// used for signature
export const createSV2 = (uid: Uint8Array, ctr: Uint8Array) => {
  const sv2 = Buffer.from([
    0x3c,
    0xc3,
    0x00,
    0x01,
    0x00,
    0x80,
    uid[0],
    uid[1],
    uid[2],
    uid[3],
    uid[4],
    uid[5],
    uid[6],
    ctr[0],
    ctr[1],
    ctr[2],
  ])

  return sv2
}
