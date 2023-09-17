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
    // should be pass with POST? not sure if this would be compatible
    // with the wallet that can create cards
    const token = req.query.token

    if (!token) {
      res.status(400).send({ status: "ERROR", reason: "token missing" })
      return
    }

    if (typeof token !== "string") {
      res.status(400).send({ status: "ERROR", reason: "token is not a string" })
      return
    }

    // TODO: token validation?

    const oneTimeCode = randomHex()
    const k0AuthKey = randomHex()
    const k2CmacKey = randomHex()
    const k3 = randomHex()
    const k4 = randomHex()

    const result = await createCardInit({
      oneTimeCode,
      k0AuthKey,
      k2CmacKey,
      k3,
      k4,
      token,
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
  lnurlw_base: string
  k0: string
  k1: string
  k2: string
  k3: string
  k4: string
  uid_privacy: string
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
    .replace("http://", "lnurlw://")
    .replace("https://", "lnurlw://")
  const k1DecryptKey = aesDecryptKey.toString("hex")

  const response: NewCardResponse = {
    PROTOCOL_NAME: "create_bolt_card_response",
    PROTOCOL_VERSION: 2,
    CARD_NAME: "dummy",
    lnurlw_base: lnurlwBase,
    k0: cardInit.k0AuthKey,
    k1: k1DecryptKey,
    k2: cardInit.k2CmacKey,
    k3: cardInit.k3,
    k4: cardInit.k4,
    uid_privacy: "Y",
  }

  res.status(200).json(response)
})

const createboltcard = ""
export { createboltcard }
