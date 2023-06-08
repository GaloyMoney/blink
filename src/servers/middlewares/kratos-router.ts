import { assert } from "console"

import cors from "cors"
import express from "express"

import { getDefaultAccountsConfig, getKratosPasswords } from "@config"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"
import {
  createAccountForEmailIdentifier,
  createAccountWithPhoneIdentifier,
  upgradeAccountFromDeviceToPhone,
} from "@app/accounts"
import { checkedToPhoneNumber } from "@domain/users"
import { checkedToUserId } from "@domain/accounts"
import { UsersRepository } from "@services/mongoose"
import { ErrorLevel } from "@domain/shared"
import { baseLogger } from "@services/logger"

const kratosRouter = express.Router({ caseSensitive: true })

const { callbackApiKey } = getKratosPasswords()

kratosRouter.use(cors({ origin: true, credentials: true }))
kratosRouter.use(express.json())

// This flow is currently not used in production
kratosRouter.post(
  "/preregistration",
  wrapAsyncToRunInSpan({
    namespace: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const key = req.headers.authorization

      if (!key) {
        baseLogger.error("missing authorization header")
        res.status(401).send("missing authorization header")
        return
      }

      if (key !== callbackApiKey) {
        baseLogger.error("incorrect authorization header")
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
          baseLogger.error({ phoneRaw, phone }, "invalid phone")
          res.status(400).send("invalid phone")
          return
        }

        const user = await UsersRepository().findByPhone(phone)

        // we expect the phone number to not exist
        if (user instanceof Error) {
          res.sendStatus(200)
          return
        }

        baseLogger.error({ phone }, "phone already exist")
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
        baseLogger.error("missing authorization header")
        res.status(401).send("missing authorization header")
        return
      }

      if (key !== callbackApiKey) {
        baseLogger.error("incorrect authorization header")
        res.status(401).send("incorrect authorization header")
        return
      }

      const body = req.body
      const {
        identity_id: userId,
        phone: phoneRaw,
        schema_id,
        email,
        transient_payload,
      } = body

      assert(schema_id === "phone_no_password_v0", "unsupported schema")

      if ((!phoneRaw && !email) || !userId) {
        baseLogger.error({ phoneRaw, email }, "missing inputs")
        res.status(400).send("missing inputs")
        return
      }

      const userIdChecked = checkedToUserId(userId)
      if (userIdChecked instanceof Error) {
        recordExceptionInCurrentSpan({
          error: userIdChecked,
          level: ErrorLevel.Critical,
          attributes: {
            userId,
          },
        })
        baseLogger.error({ userIdChecked, userId }, "invalid userId")
        res.status(400).send("invalid userId")
        return
      }

      let account: Account | RepositoryError

      // upgrade device to phone flow if both traits are present
      if (transient_payload?.deviceId && phoneRaw) {
        account = await upgradeAccountFromDeviceToPhone({
          userId: userIdChecked,
          deviceId: transient_payload.deviceId,
          phone: phoneRaw,
        })
      } else if (phoneRaw) {
        // phone+code flow
        const phone = checkedToPhoneNumber(phoneRaw)
        if (phone instanceof Error) {
          recordExceptionInCurrentSpan({
            error: phone,
            level: ErrorLevel.Critical,
            attributes: {
              userId,
              phoneRaw,
            },
          })
          baseLogger.error({ phone, phoneRaw, userId }, "invalid phone")
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
        recordExceptionInCurrentSpan({
          error: account,
          level: ErrorLevel.Critical,
          attributes: {
            userId,
            phoneRaw,
          },
        })
        baseLogger.error(
          { account, phoneRaw, email },
          `error createAccountWithPhoneIdentifier`,
        )
        res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
        return
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosRouter
