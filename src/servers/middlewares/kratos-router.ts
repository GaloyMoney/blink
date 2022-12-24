import { assert } from "console"

import cors from "cors"
import express from "express"

import { getDefaultAccountsConfig, getKratosConfig } from "@config"
import { wrapAsyncToRunInSpan } from "@services/tracing"
import { createAccountWithPhoneIdentifier } from "@app/accounts"
import { checkedToPhoneNumber } from "@domain/users"
import { checkedToUserId } from "@domain/accounts"

const kratosRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins, callbackKey } = getKratosConfig()

kratosRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))
kratosRouter.use(express.json())

kratosRouter.post(
  "/registration",
  wrapAsyncToRunInSpan({
    namespace: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const key = req.headers.authorization

      if (!key) {
        console.log("missing authorization header")
        res.status(401).send("missing authorization header")
        return
      }

      if (key !== callbackKey) {
        console.log("incorrect authorization header")
        res.status(401).send("incorrect authorization header")
        return
      }

      const body = req.body
      const { identity_id: userId, phone: phoneRaw, schema_id } = body

      assert(schema_id === "phone_no_password_v0", "unsupported schema")

      if (!phoneRaw || !userId) {
        console.log("missing inputs")
        res.status(400).send("missing inputs")
        return
      }

      const phone = checkedToPhoneNumber(phoneRaw)
      if (phone instanceof Error) {
        console.log("invalid phone")
        res.status(400).send("invalid phone")
        return
      }

      const userIdChecked = checkedToUserId(userId)
      if (userIdChecked instanceof Error) {
        console.log("invalid userId")
        res.status(400).send("invalid userId")
        return
      }

      const account = await createAccountWithPhoneIdentifier({
        newAccountInfo: { phone, kratosUserId: userIdChecked },
        config: getDefaultAccountsConfig(),
      })
      if (account instanceof Error) {
        console.log(`error createAccountWithPhoneIdentifier: ${account}`)
        res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
        return
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosRouter
