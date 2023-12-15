import {
  MissingRegistrationPayloadPropertiesError,
  UnsupportedSchemaTypeError,
} from "@/domain/authentication/errors"
import { RegistrationPayloadValidator } from "@/domain/authentication/registration-payload-validator"
import { InvalidPhoneNumber, InvalidUserId } from "@/domain/errors"

import { SchemaIdType } from "@/services/kratos"

import { randomPhone, randomUserId } from "test/helpers/random"

describe("RegistrationPayloadValidator", () => {
  const validator = RegistrationPayloadValidator(SchemaIdType.PhoneNoPasswordV0)

  it("validates valid body", () => {
    const rawUserId = randomUserId()
    const rawPhone = randomPhone()
    const expectedPayload: RegistrationPayload = {
      userId: rawUserId as UserId,
      phone: rawPhone,
      phoneMetadata: undefined,
    }

    const validated = validator.validate({
      identity_id: rawUserId,
      phone: rawPhone,
      schema_id: SchemaIdType.PhoneNoPasswordV0,
    })

    expect(validated).toStrictEqual(expectedPayload)
  })

  it("returns missing inputs error", () => {
    const identity_id = "identity_id"
    const phone = "phone"
    const schema_id = "schema_id"

    const validatedEmptyBody = validator.validate({})
    expect(validatedEmptyBody).toBeInstanceOf(MissingRegistrationPayloadPropertiesError)

    const validatedMissingUserId = validator.validate({ phone, schema_id })
    expect(validatedMissingUserId).toBeInstanceOf(
      MissingRegistrationPayloadPropertiesError,
    )

    const validatedMissingPhone = validator.validate({ identity_id, schema_id })
    expect(validatedMissingPhone).toBeInstanceOf(
      MissingRegistrationPayloadPropertiesError,
    )

    const validatedMissingSchemaId = validator.validate({ identity_id, phone })
    expect(validatedMissingSchemaId).toBeInstanceOf(
      MissingRegistrationPayloadPropertiesError,
    )
  })

  it("return invalid schema_id error", () => {
    const invalidSchemaId = "invalid-schema-id"
    const validatedBadSchemaId = validator.validate({
      identity_id: randomUserId(),
      phone: randomPhone(),
      schema_id: invalidSchemaId,
    })
    expect(invalidSchemaId).not.toBe(SchemaIdType.PhoneNoPasswordV0)
    expect(validatedBadSchemaId).toBeInstanceOf(UnsupportedSchemaTypeError)
  })

  it("return invalid identity_id error", () => {
    const validatedBadUserId = validator.validate({
      identity_id: "invalid-user-id",
      phone: randomPhone(),
      schema_id: SchemaIdType.PhoneNoPasswordV0,
    })
    expect(validatedBadUserId).toBeInstanceOf(InvalidUserId)
  })

  it("return invalid phone error", () => {
    const validatedBadPhone = validator.validate({
      identity_id: randomUserId(),
      phone: "invalid-phone",
      schema_id: SchemaIdType.PhoneNoPasswordV0,
    })
    expect(validatedBadPhone).toBeInstanceOf(InvalidPhoneNumber)
  })
})
