// import { AesCmac } from "aes-cmac"
const aesCmac = require("node-aes-cmac").aesCmac

const aesjs = require("aes-js")

class DecryptionError extends Error {
  constructor(err: Error) {
    super(err.message)
  }
}

class UnknownError extends Error {}

export function aesDecrypt(key: Buffer, data: Buffer): Buffer | DecryptionError {
  try {
    const aesCtr = new aesjs.ModeOfOperation.cbc(key)
    const decryptedBytes = aesCtr.decrypt(data)
    return decryptedBytes
  } catch (err) {
    console.log(err)
    if (err instanceof Error) return new DecryptionError(err)
    return new UnknownError()
  }
}

export async function checkSignature(
  uid: Uint8Array,
  ctr: Uint8Array,
  k2CmacKey: Buffer,
  cmac: Buffer,
): Promise<boolean> {
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

  let calculatedCmac

  try {
    calculatedCmac = getSunMAC(k2CmacKey, sv2)
  } catch (error) {
    console.error(error)
    throw new Error("issue with cMac")
  }

  // Compare the result
  return Buffer.compare(calculatedCmac, cmac) === 0
}

function getSunMAC(key: Buffer, sv2: Buffer): Buffer {
  const options = { returnAsBuffer: true }
  const cmac1 = aesCmac(key, sv2, options)
  const cmac2 = aesCmac(cmac1, new Buffer(""), options)

  const halfMac = Buffer.alloc(cmac2.length / 2)
  for (let i = 1; i < cmac2.length; i += 2) {
    halfMac[i >> 1] = cmac2[i]
  }

  return halfMac
}
