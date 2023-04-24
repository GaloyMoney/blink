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
import { UsersRepository } from "@services/mongoose"

const kratosRouter = express.Router({ caseSensitive: true })

const { callbackApiKey } = getKratosPasswords()

kratosRouter.use(cors({ origin: true, credentials: true }))
kratosRouter.use(express.json())

kratosRouter.post(
  "/preregistration",
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
      const { phone: phoneRaw, schema_id } = body

      assert(schema_id === "phone_no_password_v0", "unsupported schema")

      // phone+code flow
      if (phoneRaw) {
        const phone = checkedToPhoneNumber(phoneRaw)
        if (phone instanceof Error) {
          console.log("invalid phone")
          res.status(400).send("invalid phone")
          return
        }

        const user = await UsersRepository().findByPhone(phone)

        // we expect the phone number to not exist
        if (user instanceof Error) {
          console.log("phone doesn't already exist")
          res.sendStatus(200)
          return
        }

        console.error("phone already exist")
        res.status(500).send(`phone already exist`)
        return
      }

      // TODO
      // email+password flow
      res.status(500).send(`unsupported flow`)
      return
    },
  }),
)

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
        // TODO: log this error as critical to honeycomb
        console.log("invalid userId")
        res.status(400).send("invalid userId")
        return
      }

      let account: Account | RepositoryError
      // phone+code flow
      if (phoneRaw) {
        const phone = checkedToPhoneNumber(phoneRaw)
        if (phone instanceof Error) {
          // TODO: log this error as critical to honeycomb
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
        // TODO: log this error as critical to honeycomb
        console.log(`error createAccountWithPhoneIdentifier: ${account}`)
        res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
        return
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosRouter
