import { aesDecrypt, aesEncrypt, checkSignature, getSunMAC } from "./aes"

import { createSV2, decodePToUidCtr, encodeUidCtrToP } from "./decoder"

const aesjs = require("aes-js")

const values = [
  {
    p: aesjs.utils.hex.toBytes("4E2E289D945A66BB13377A728884E867"),
    c: Buffer.from("E19CCB1FED8892CE", "hex"),
    aes_decrypt_key: aesjs.utils.hex.toBytes("0c3b25d92b38ae443229dd59ad34b85d"),
    aes_cmac_key: Buffer.from("b45775776cb224c75bcde7ca3704e933", "hex"),
    decrypted_uid: "04996c6a926980",
    decrypted_ctr: "030000",
    decoded_ctr: 3,
    sv2: new Buffer([60, 195, 0, 1, 0, 128, 4, 153, 108, 106, 146, 105, 128, 3, 0, 0]),
  },
  {
    p: aesjs.utils.hex.toBytes("00F48C4F8E386DED06BCDC78FA92E2FE"),
    c: Buffer.from("66B4826EA4C155B4", "hex"),
    aes_decrypt_key: aesjs.utils.hex.toBytes("0c3b25d92b38ae443229dd59ad34b85d"),
    aes_cmac_key: Buffer.from("b45775776cb224c75bcde7ca3704e933", "hex"),
    decrypted_uid: "04996c6a926980",
    decrypted_ctr: "050000",
    decoded_ctr: 5,
  },
  {
    p: aesjs.utils.hex.toBytes("0DBF3C59B59B0638D60B5842A997D4D1"),
    c: Buffer.from("CC61660C020B4D96", "hex"),
    aes_decrypt_key: aesjs.utils.hex.toBytes("0c3b25d92b38ae443229dd59ad34b85d"),
    aes_cmac_key: Buffer.from("b45775776cb224c75bcde7ca3704e933", "hex"),
    decrypted_uid: "04996c6a926980",
    decrypted_ctr: "070000",
    decoded_ctr: 7,
  },
]

describe("decoding", () => {
  values.forEach(
    ({
      p,
      c,
      aes_decrypt_key,
      aes_cmac_key,
      decrypted_uid,
      decrypted_ctr,
      decoded_ctr,
    }) => {
      test(`testing ${aesjs.utils.hex.fromBytes(p)}`, async () => {
        const decryptedP = aesDecrypt(aes_decrypt_key, p)
        if (decryptedP instanceof Error) {
          throw decryptedP
        }

        const { uid, uidRaw, ctr, ctrRawInverseBytes } = decodePToUidCtr(decryptedP)

        expect(uid).toEqual(decrypted_uid)
        expect(ctr).toEqual(decoded_ctr)
        // expect(ctrRawInverseBytes).toEqual(decrypted_ctr)

        // console.log({ uidRaw, ctrRawInverseBytes, aes_cmac_key, c })

        const cmacVerified = await checkSignature(
          uidRaw,
          ctrRawInverseBytes,
          aes_cmac_key,
          c,
        )
        expect(cmacVerified).toEqual(true)
      })
    },
  )
})

function uint8ArrayToHex(uint8Array: Uint8Array) {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

describe("encoding", () => {
  it("should encrypt uid and ctr", () => {
    const value = values[0]

    const uid = Buffer.from(value.decrypted_uid, "hex")
    const ctr = Buffer.from(value.decrypted_ctr, "hex")

    // create P
    const p1 = encodeUidCtrToP(uid, ctr)
    const p2 = Buffer.from(p1)

    // encrypt P
    const encryptP = aesEncrypt(value.aes_decrypt_key, p2)
    if (encryptP instanceof Error) {
      throw encryptP
    }

    expect(uint8ArrayToHex(encryptP)).toEqual(uint8ArrayToHex(value.p))
  })

  it("should sign P", () => {
    const value = values[0]
    const p = value.p
    p

    const uid = Buffer.from(value.decrypted_uid, "hex")
    const ctr = Buffer.from(value.decrypted_ctr, "hex")

    // create cv2
    const cv2 = createSV2(uid, ctr)
    expect(cv2).toEqual(value.sv2)

    // create cmac
    const cmac = getSunMAC(value.aes_cmac_key, cv2)
    expect(cmac).toEqual(value.c)
  })
})
