import cors from "cors"
import express from "express"

import { KRATOS_CALLBACK_API_KEY, getDefaultAccountsConfig } from "@config"

import { AuthenticationKeyValidator } from "@domain/authentication/key-validator"
import { RegistrationPayloadValidator } from "@domain/authentication/registration-payload-validator"
import { ErrorLevel } from "@domain/shared"
import { InvalidPhoneNumber, InvalidUserId } from "@domain/errors"

import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"
import { baseLogger } from "@services/logger"
import { SchemaIdType } from "@services/kratos"

import { createAccountWithPhoneIdentifier } from "@app/accounts"

const kratosCallback = express.Router({ caseSensitive: true })

kratosCallback.use(cors({ origin: true, credentials: true }))
kratosCallback.use(express.json())

kratosCallback.post(
  "/registration",
  wrapAsyncToRunInSpan({
    namespace: "registration",
    fn: async (req: express.Request, res: express.Response) => {
      const key = req.headers.authorization

      const isValidKey = AuthenticationKeyValidator(KRATOS_CALLBACK_API_KEY).validate(key)
      if (isValidKey instanceof Error) {
        const { message } = isValidKey
        baseLogger.error(message)
        res.status(401).send(message)
        return
      }

      const body = req.body
      baseLogger.info(
        { transient_payload: body.transient_payload },
        "transient_payload callback kratos router",
      )

      const regPayloadValidator = RegistrationPayloadValidator(
        SchemaIdType.PhoneNoPasswordV0,
      )
      const regPayload = regPayloadValidator.validate(body)
      if (regPayload instanceof Error) {
        let attributes: { userIdRaw: string; phoneRaw: string } | undefined = undefined
        if (
          regPayload instanceof InvalidUserId ||
          regPayload instanceof InvalidPhoneNumber
        ) {
          attributes = {
            userIdRaw: body.identity_id,
            phoneRaw: body.phone,
          }
          recordExceptionInCurrentSpan({
            error: regPayload,
            level: ErrorLevel.Critical,
            attributes,
          })
        }

        const { message: errMsg } = regPayload
        baseLogger.error(attributes, errMsg)
        res.status(400).send(errMsg)
        return
      }

      const { userId, phone, phoneMetadata } = regPayload
      const account = await createAccountWithPhoneIdentifier({
        newAccountInfo: { phone, kratosUserId: userId },
        config: getDefaultAccountsConfig(),
        phoneMetadata,
      })
      if (account instanceof Error) {
        recordExceptionInCurrentSpan({
          error: account,
          level: ErrorLevel.Critical,
          attributes: {
            userId,
            phone,
          },
        })
        baseLogger.error({ account, phone }, `error createAccountWithPhoneIdentifier`)
        res.status(500).send(`error createAccountWithPhoneIdentifier: ${account}`)
        return
      }

      res.status(200).send("ok\n")
    },
  }),
)

export default kratosCallback
