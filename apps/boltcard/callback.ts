import express from "express"

import { boltcardRouter } from "./router"
import { fetchByK1 } from "./knex"

boltcardRouter.get("/callback", async (req: express.Request, res: express.Response) => {
  const k1 = req?.query?.k1
  const pr = req?.query?.pr

  console.log({ k1, pr })

  if (!k1 || !pr) {
    res.status(400).send({ status: "ERROR", reason: "missing k1 or pr" })
    return
  }

  if (typeof k1 !== "string" || typeof pr !== "string") {
    res.status(400).send({ status: "ERROR", reason: "invalid k1 or pr" })
    return
  }

  const payment = await fetchByK1(k1)
  console.log(payment)
  // fetch user from k1
  //   payInvoice(pr)

  res.json({ status: "OK" })
})

const callback = "dummy"
export { callback }
