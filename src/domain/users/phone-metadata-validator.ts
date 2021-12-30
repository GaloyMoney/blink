import { MissingPhoneMetadataError, InvalidPhoneMetadataTypeError } from "@domain/errors"

export const PhoneMetadataValidator = (): PhoneMetadataValidator => {
  const validate = (phoneMetadata: PhoneMetadata | null): true | ApplicationError => {
    if (phoneMetadata === null || !phoneMetadata.carrier)
      return new MissingPhoneMetadataError()

    if (phoneMetadata.carrier.type === "voip") return new InvalidPhoneMetadataTypeError()

    return true
  }

  return {
    validate,
  }
}
