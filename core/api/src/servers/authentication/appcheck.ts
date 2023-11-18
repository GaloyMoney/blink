import axios from "axios"
import express, { Request, Response } from "express"

export const appcheckRouter = express.Router({ caseSensitive: true })

appcheckRouter.post("/token", async (req: Request, res: Response) => {
  const Appcheck = req.header("Appcheck")

  if (!req.body) {
    // this is the object expected: https://www.ory.sh/docs/oathkeeper/pipeline/mutator#hydrator
    return res.status(400).send({ error: "missing body" })
  }

  if (!Appcheck) {
    return res.send({ ...req.body })
  }

  let jti: string = ""

  try {
    const result = await axios.post(
      "http://localhost:4456/decisions/appcheck",
      {},
      {
        headers: {
          Appcheck,
        },
      },
    )

    jti = result?.headers["x-appcheck-jti"]
  } catch (err) {
    return res.status(500).send({ error: `issue fetching oathkeeper: ${err}` })
  }

  if (!jti) {
    return res.status(400).send({ error: "missing jti" })
  }

  try {
    const extra = req.body?.extra ?? {}
    extra["appcheck_jti"] = jti
    if (req.body) {
      req.body.extra = extra
    }
  } catch (err) {
    return res.status(500).send({ error: `issue setting jti: ${err}` })
  }

  return res.send({ ...req.body })
})
