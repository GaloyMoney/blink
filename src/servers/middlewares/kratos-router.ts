import { assert } from "console"

import cors from "cors"
import express from "express"

import { getDefaultAccountsConfig, getKratosConfig } from "@config"
import { wrapAsyncToRunInSpan } from "@services/tracing"
import { createAccountWithPhoneIdentifier } from "@app/accounts"
import { checkedToPhoneNumber } from "@domain/users"
import { checkedToUserId } from "@domain/accounts"

const kratosRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

kratosRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))
kratosRouter.use(express.json())

kratosRouter.post(
  "/registration",
  wrapAsyncToRunInSpan({
    namespace: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const body = req.body
      const { identity_id: userId, phone, schema_id } = body

      assert(schema_id === "phone_no_password_v0", "unsupported schema")

      if (!phone || !userId) {
        console.log("missing inputs")
        res.status(400).send("missing inputs")
        return
      }

      const phoneValid = checkedToPhoneNumber(phone)
      if (phoneValid instanceof Error) {
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
