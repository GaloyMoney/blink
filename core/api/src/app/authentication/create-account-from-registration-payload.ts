import { KRATOS_CALLBACK_API_KEY, getDefaultAccountsConfig } from "@/config"

import { CallbackSecretValidator } from "@/domain/authentication/secret-validator"
import { RegistrationPayloadValidator } from "@/domain/authentication/registration-payload-validator"
import { ErrorLevel } from "@/domain/shared"
import { InvalidPhoneNumber, InvalidUserId } from "@/domain/errors"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"
import { SchemaIdType } from "@/services/kratos"

import { createAccountWithPhoneIdentifier } from "@/app/accounts"

export const createAccountFromRegistrationPayload = async ({
  secret,
  body,
}: {
  secret: string | undefined
  body: {
    identity_id?: string
    phone?: string
    schema_id?: string
  }
}): Promise<Account | ApplicationError> => {
  addAttributesToCurrentSpan({
    "registration.body": JSON.stringify(body),
  })

  const isValidKey = CallbackSecretValidator(KRATOS_CALLBACK_API_KEY).authorize(secret)
  if (isValidKey instanceof Error) {
    return isValidKey
  }

  const regPayloadValidator = RegistrationPayloadValidator(SchemaIdType.PhoneNoPasswordV0)
  const regPayload = regPayloadValidator.validate(body)
  if (regPayload instanceof Error) {
    if (regPayload instanceof InvalidUserId || regPayload instanceof InvalidPhoneNumber) {
      recordExceptionInCurrentSpan({
        error: regPayload,
        level: ErrorLevel.Critical,
        attributes: {
          userIdRaw: body.identity_id,
          phoneRaw: body.phone,
        },
      })
    }
    return regPayload
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
  }

  return account
}
