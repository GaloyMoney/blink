import { checkedToUserId } from "@domain/accounts"
import { checkedToPhoneNumber } from "@domain/users"

import {
  MissingRegistrationPayloadPropertiesError,
  UnsupportedSchemaTypeError,
} from "./errors"

export const RegistrationPayloadValidator = (
  schemaId: SchemaId,
): RegistrationPayloadValidator => {
  const validate = (rawBody: {
    identity_id?: string
    phone?: string
    schema_id?: string
    transient_payload?: { phoneMetadata?: PhoneMetadata }
  }): RegistrationPayload | ValidationError => {
    const {
      identity_id: userIdRaw,
      phone: phoneRaw,
      schema_id: schemaIdRaw,
      transient_payload,
    } = rawBody

    if (!(phoneRaw && userIdRaw && schemaIdRaw)) {
      const errMsg = "missing inputs"
      return new MissingRegistrationPayloadPropertiesError(errMsg)
    }

    if (schemaIdRaw !== schemaId) {
      const errMsg = "unsupported schema_id"
      return new UnsupportedSchemaTypeError(errMsg)
    }

    const userIdChecked = checkedToUserId(userIdRaw)
    if (userIdChecked instanceof Error) {
      const errMsg = "invalid userId"
      userIdChecked.message = errMsg
      return userIdChecked
    }

    const phoneChecked = checkedToPhoneNumber(phoneRaw)
    if (phoneChecked instanceof Error) {
      const errMsg = "invalid phone"
      phoneChecked.message = errMsg
      return phoneChecked
    }

    const phoneMetadata = transient_payload?.phoneMetadata

    return {
      userId: userIdChecked,
      phone: phoneChecked,
      phoneMetadata,
    }
  }

  return {
    validate,
  }
}
