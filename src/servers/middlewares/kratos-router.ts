import { assert } from "console"

import cors from "cors"
import express from "express"

import { getDefaultAccountsConfig, getKratosPasswords } from "@config"
import { wrapAsyncToRunInSpan } from "@services/tracing"
import {
  createAccountForEmailIdentifier,
  createAccountWithPhoneIdentifier,
} from "@app/accounts"
import { checkedToPhoneNumber } from "@domain/users"
import { checkedToUserId } from "@domain/accounts"

const kratosRouter = express.Router({ caseSensitive: true })

const { callbackApiKey } = getKratosPasswords()

kratosRouter.use(cors({ origin: true, credentials: true }))
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

      if (key !== callbackApiKey) {
        console.log("incorrect authorization header")
        res.status(401).send("incorrect authorization header")
        return
      }

      const body = req.body
      const { identity_id: userId, phone: phoneRaw, schema_id, email } = body

      assert(schema_id === "phone_no_password_v0", "unsupported schema")

      if ((!phoneRaw && !email) || !userId) {
        console.log("missing inputs")
        res.status(400).send("missing inputs")
        return
      }

      const userIdChecked = checkedToUserId(userId)
      if (userIdChecked instanceof Error) {
        console.log("invalid userId")
        res.status(400).send("invalid userId")
        return
      }

      let account
      // phone+code flow
      if (phoneRaw) {
        const phone = checkedToPhoneNumber(phoneRaw)
        if (phone instanceof Error) {
          console.log("invalid phone")
          res.status(400).send("invalid phone")
          return
        }
        account = await createAccountWithPhoneIdentifier({
          newAccountInfo: { phone, kratosUserId: userIdChecked },
          config: getDefaultAccountsConfig(),
        })
      } else if (email) {
        // email+password flow
        // kratos user exists from self registration flow
        account = await createAccountForEmailIdentifier({
          kratosUserId: userIdChecked,
          config: getDefaultAccountsConfig(),
        })
      } else {
        // insert new flow, such as email with code
        res.status(500).send("Invalid login flow")
        return
      }

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
