import { randomBytes } from "crypto"

import express from "express"

import { aesDecrypt, checkSignature } from "./aes"
import { aesDecryptKey, serverUrl } from "./config"
import { decryptedPToUidCtr } from "./decoder"
import {
  CardInitInput,
  createCard,
  fetchAllWithStatusFetched,
  fetchByUid,
  insertk1,
  markCardInitAsUsed,
} from "./knex"
import { boltcardRouter } from "./router"

function generateSecureRandomString(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
}

const maybeSetupCard = async ({
  uidRaw,
  ctrRawInverseBytes,
  ba_c,
}: {
  uidRaw: Uint8Array
  ctrRawInverseBytes: Uint8Array
  ba_c: Buffer
}): Promise<CardInitInput | null> => {
  const cardInits = await fetchAllWithStatusFetched()

  for (const cardInit of cardInits) {
    console.log({ cardInit }, "cardInit")
    const aesCmacKey = Buffer.from(cardInit.k2CmacKey, "hex")

    const cmacVerified = await checkSignature(
      uidRaw,
      ctrRawInverseBytes,
      aesCmacKey,
      ba_c,
    )

    if (cmacVerified) {
      console.log("cmac verified")
      // associate card
      return cardInit
    }
  }

  return null
}

boltcardRouter.get("/ln", async (req: express.Request, res: express.Response) => {
  const raw_p = req?.query?.p
  const raw_c = req?.query?.c

  if (!raw_p || !raw_c) {
    res.status(400).send({ status: "ERROR", reason: "missing p or c" })
    return
  }

  if (raw_p?.length !== 32 || raw_c?.length !== 16) {
    res.status(400).send({ status: "ERROR", reason: "invalid p or c" })
    return
  }

  if (typeof raw_p !== "string" || typeof raw_c !== "string") {
    res.status(400).send({ status: "ERROR", reason: "invalid p or c" })
    return
  }

  const ba_p = Buffer.from(raw_p, "hex")
  const ba_c = Buffer.from(raw_c, "hex")

  console.log({ ba_p, ba_c })

  const decryptedP = aesDecrypt(aesDecryptKey, ba_p)
  if (decryptedP instanceof Error) {
    res.status(400).send({ status: "ERROR", reason: "impossible to decrypt P" })
    return
  }

  // TODO error management
  const { uidRaw, uid, ctrRawInverseBytes, ctr } = decryptedPToUidCtr(decryptedP)

  console.log({
    uid,
    uidRaw,
    ctrRawInverseBytes,
  })

  let card = await fetchByUid(uid)
  console.log({ card }, "card")

  if (!card) {
    const result = await maybeSetupCard({ uidRaw, ctrRawInverseBytes, ba_c })

    if (result) {
      const { k0AuthKey, k2CmacKey, k3, k4, token } = result
      await markCardInitAsUsed(k2CmacKey)

      card = await createCard({ uid, k0AuthKey, k2CmacKey, k3, k4, ctr, token })
    } else {
      res.status(400).send({ status: "ERROR", reason: "card not found" })
      return
    }
  } else {
    if (!card.enabled) {
      res.status(400).send({ status: "ERROR", reason: "card disabled" })
      return
    }
  }

  // TODO: check walletId and fail if not found
  // this would improve the experience of the POS

  const k1 = generateSecureRandomString(32)

  await insertk1({ k1, cardId: card.id })

  res.json({
    tag: "withdrawRequest",
    callback: serverUrl + "/callback",
    k1,
    defaultDescription: "payment for a blink card",
    minWithdrawable: 1000,
    maxWithdrawable: 100000000000,
  })
})

const lnurlw = "dummy"
export { lnurlw }
