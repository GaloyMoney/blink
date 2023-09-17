import express from "express"

import { boltcardRouter } from "./router"
import { fetchByCardId, fetchByOneTimeCode } from "./knex"
import { AES_DECRYPT_KEY } from "./config"

boltcardRouter.get(
  "/wipeboltcard",
  async (req: express.Request, res: express.Response) => {
    // should be pass with POST? not sure if this would be compatible
    // with the wallet that can create cards
    const cardId = req.query.cardId
    const oneTimeCode = req.query.a

    if (!cardId && !oneTimeCode) {
      res.status(400).send({ status: "ERROR", reason: "cardId missing" })
      return
    }
    // TODO authorization

    // TODO may be both on CardInit and Card table
    let card
    if (cardId) {
      if (typeof cardId !== "string") {
        res.status(400).send({ status: "ERROR", reason: "cardId is not a string" })
        return
      }

      card = await fetchByCardId(cardId)
    } else {
      if (typeof oneTimeCode !== "string") {
        res.status(400).send({ status: "ERROR", reason: "oneTimeCode is not a string" })
        return
      }

      card = await fetchByOneTimeCode(oneTimeCode)
    }

    if (!card) {
      res.status(400).send({ status: "ERROR", reason: "card not found" })
      return
    }

    res.json({
      status: "OK",
      action: "wipe",
      k0: card.k0AuthKey,
      k1: AES_DECRYPT_KEY,
      k2: card.k2CmacKey,
      k3: card.k3,
      k4: card.k4,
      uid: card.uid,
      version: 1,
    })
  },
)

const wipe = ""
export { wipe }
