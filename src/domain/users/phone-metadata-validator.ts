import { MissingPhoneMetadataError, InvalidPhoneMetadataTypeError } from "@domain/errors"

export const PhoneMetadataValidator = (): PhoneMetadataValidator => {
  const validate = (phoneMetadata?: PhoneMetadata): true | ApplicationError => {
    if (!phoneMetadata || !phoneMetadata.carrier) return new MissingPhoneMetadataError()

    if (phoneMetadata.carrier.type === "voip") return new InvalidPhoneMetadataTypeError()

    return true
  }

  return {
    validate,
  }
}
