import cors from "cors"
import express from "express"

import { KRATOS_CALLBACK_API_KEY, getDefaultAccountsConfig } from "@config"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"
import { createAccountWithPhoneIdentifier } from "@app/accounts"
import { checkedToPhoneNumber } from "@domain/users"
import { checkedToUserId } from "@domain/accounts"
import { ErrorLevel } from "@domain/shared"
import { baseLogger } from "@services/logger"
import { SchemaIdType } from "@services/kratos"

const kratosCallback = express.Router({ caseSensitive: true })

kratosCallback.use(cors({ origin: true, credentials: true }))
kratosCallback.use(express.json())

kratosCallback.post(
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

      if (key !== KRATOS_CALLBACK_API_KEY) {
        baseLogger.error("incorrect authorization header")
        res.status(401).send("incorrect authorization header")
        return
      }

      const body = req.body

      const { identity_id: userId, phone: phoneRaw, schema_id } = body

      if (schema_id !== SchemaIdType.PhoneNoPasswordV0) {
        return res.status(400).send("unsupported schema_id")
      }

      if (!phoneRaw || !userId) {
        baseLogger.error({ phoneRaw, userId }, "missing inputs")
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

      if (phoneRaw) {
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
      } else {
        res.status(500).send("Invalid or unsupported login flow")
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
        baseLogger.error({ account, phoneRaw }, `error createAccountWithPhoneIdentifier`)
        res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
        return
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosCallback
