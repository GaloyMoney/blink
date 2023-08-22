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
      return new MissingRegistrationPayloadPropertiesError()
    }

    if (schemaIdRaw !== schemaId) {
      return new UnsupportedSchemaTypeError()
    }

    const userIdChecked = checkedToUserId(userIdRaw)
    if (userIdChecked instanceof Error) return userIdChecked

    const phoneChecked = checkedToPhoneNumber(phoneRaw)
    if (phoneChecked instanceof Error) return phoneChecked

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
