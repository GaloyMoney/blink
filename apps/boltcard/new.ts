import { randomBytes } from "crypto"

import express from "express"

import { boltcardRouter } from "./router"
import { aesDecryptKey, serverUrl } from "./config"
import { createCardInit, fetchByOneTimeCode } from "./knex"

function randomHex(): string {
  try {
    const bytes: Buffer = randomBytes(16)
    return bytes.toString("hex")
  } catch (error) {
    if (error instanceof Error) {
      console.warn(error.message)
      throw error
    }
  }
}

// curl -s http://localhost:3000/createboltcard

boltcardRouter.get(
  "/createboltcard",
  async (req: express.Request, res: express.Response) => {
    const accountId = req.query.accountId

    if (!accountId) {
      res.status(400).send({ status: "ERROR", reason: "accountId missing" })
      return
    }

    if (typeof accountId !== "string") {
      res.status(400).send({ status: "ERROR", reason: "accountId is not a string" })
      return
    }

    // TODO: accountId uuid validation

    const oneTimeCode = randomHex()
    const k0AuthKey = "0c3b25d92b38ae443229dd59ad34b85d"
    const k2CmacKey = "b45775776cb224c75bcde7ca3704e933"
    const k3 = randomHex()
    const k4 = randomHex()

    const result = await createCardInit({
      oneTimeCode,
      k0AuthKey,
      k2CmacKey,
      k3,
      k4,
      accountId,
    })

    if (result instanceof Error) {
      res.status(400).send({ status: "ERROR", reason: "impossible to create card" })
      return
    }

    const url = `${serverUrl}/new?a=${oneTimeCode}`
    res.json({
      status: "OK",
      url,
    })
  },
)

interface NewCardResponse {
  PROTOCOL_NAME: string
  PROTOCOL_VERSION: number
  CARD_NAME: string
  LNURLW_BASE: string
  K0: string
  K1: string
  K2: string
  K3: string
  K4: string
  UID_PRIVACY: string
}

boltcardRouter.get("/new", async (req: express.Request, res: express.Response) => {
  const url = req.url
  console.debug("new_card url:", url)

  const oneTimeCode = req.query.a

  if (!oneTimeCode) {
    console.debug("a not found")
    res.status(400).send({ status: "ERROR", reason: "a missing" })
    return
  }

  if (typeof oneTimeCode !== "string") {
    console.debug("a is not a string")
    res.status(400).send({ status: "ERROR", reason: "Bad Request" })
    return
  }

  const cardInit = await fetchByOneTimeCode(oneTimeCode)

  if (!cardInit) {
    console.debug("cardInit not found")
    res.status(400).send({ status: "ERROR", reason: "cardInit not found" })
    return
  }

  if (cardInit.status !== "init") {
    console.debug("cardInit already fetched")
    res.status(400).send({ status: "ERROR", reason: "code has been fetched" })
    return
  }

  const lnurlwBase = `${serverUrl}/ln`
  const k1DecryptKey = aesDecryptKey.toString("hex")

  const response: NewCardResponse = {
    PROTOCOL_NAME: "create_bolt_card_response",
    PROTOCOL_VERSION: 2,
    CARD_NAME: "dummy",
    LNURLW_BASE: lnurlwBase,
    K0: cardInit.k0AuthKey,
    K1: k1DecryptKey,
    K2: cardInit.k2CmacKey,
    K3: cardInit.k3,
    K4: cardInit.k4,
    UID_PRIVACY: "Y",
  }

  res.status(200).json(response)
})

const createboltcard = ""
export { createboltcard }
