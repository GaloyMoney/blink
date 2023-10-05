import cors from "cors"
import express from "express"

import { Authentication } from "@/app"

import {
  SecretForAuthNCallbackError,
  RegistrationPayloadValidationError,
} from "@/domain/authentication/errors"
import { ErrorLevel } from "@/domain/shared"

import { baseLogger } from "@/services/logger"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"

const errorResponseMessages: { [key: string]: string } = {
  MissingSecretForAuthNCallbackError: "missing authorization header",
  InvalidSecretForAuthNCallbackError: "incorrect authorization header",
  MissingRegistrationPayloadPropertiesError: "missing inputs",
  UnsupportedSchemaTypeError: "unsupported schema_id",
  InvalidUserId: "invalid userId",
  InvalidPhoneNumber: "invalid phone",
}

const kratosCallback = express.Router({ caseSensitive: true })

kratosCallback.use(cors({ origin: true, credentials: true }))
kratosCallback.use(express.json())

kratosCallback.post(
  "/registration",
  wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.kratos",
    fnName: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const secret = req.headers.authorization
      const body = req.body

      const account = await Authentication.createAccountFromRegistrationPayload({
        secret,
        body,
      })
      if (account instanceof Error) {
        const message = errorResponseMessages[account.name] || "unknown error"
        switch (true) {
          case account instanceof SecretForAuthNCallbackError:
            baseLogger.error(message)
            res.status(401).send(message)
            return

          case account instanceof RegistrationPayloadValidationError:
            baseLogger.error(body, message)
            res.status(400).send(message)
            return

          default:
            baseLogger.error(
              { account, phone: body.phone },
              `error createAccountWithPhoneIdentifier`,
            )
            recordExceptionInCurrentSpan({ error: account, level: ErrorLevel.Critical })

            res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
            return
        }
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosCallback
