import { aesEncrypt, getSunMAC } from "@/services/crypto/aes"
import { createSV2, encodeUidCtrToP } from "@/services/crypto/decoder"

const aesjs = require("aes-js")

const ctrInit = "030000"

export const main = (uidInit: string, k1: string, k2: string) => {
  //   "0c3b25d92b38ae443229dd59ad34b85d"
  // k2: b45775776cb224c75bcde7ca3704e933

  const uid = Buffer.from(uidInit, "hex")
  const ctr = Buffer.from(ctrInit, "hex")

  const p1 = encodeUidCtrToP(uid, ctr)
  const p2 = Buffer.from(p1)

  // encrypt P
  const encryptP = aesEncrypt(Buffer.from(k1, "hex"), p2)
  if (encryptP instanceof Error) {
    throw encryptP
  }

  const cv2 = createSV2(uid, ctr)
  const cmac = getSunMAC(Buffer.from(k2, "hex"), cv2)

  return JSON.stringify({
    c: cmac.toString("hex"),
    p: aesjs.utils.hex.fromBytes(encryptP),
  })
}

console.log(main(process.argv[2], process.argv[3], process.argv[4]))
