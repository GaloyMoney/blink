import {
  MissingIPMetadataError,
  InvalidIPMetadataCountryError,
  InvalidIPMetadataProxyError,
  InvalidIPMetadataASNError,
} from "@domain/errors"

export const IPMetadataValidator = ({
  denyIPCountries,
  allowIPCountries,
  denyASNs,
  allowASNs,
}: IPMetadataValidatorArgs): IPMetadataValidator => {
  const validateForReward = (ipMetadata?: IPType): true | ValidationError => {
    if (!ipMetadata || !ipMetadata.isoCode || !ipMetadata.asn)
      return new MissingIPMetadataError()

    if (ipMetadata.proxy) return new InvalidIPMetadataProxyError()

    const isoCode = ipMetadata.isoCode.toUpperCase()
    const allowedCountry =
      allowIPCountries.length <= 0 || allowIPCountries.includes(isoCode)
    const deniedCountry = denyIPCountries.length > 0 && denyIPCountries.includes(isoCode)
    if (!allowedCountry || deniedCountry) return new InvalidIPMetadataCountryError()

    const asn = ipMetadata.asn.toUpperCase()
    const allowedASN = allowASNs.length <= 0 || allowASNs.includes(asn)
    const deniedASN = denyASNs.length > 0 && denyASNs.includes(asn)
    if (!allowedASN || deniedASN) return new InvalidIPMetadataASNError()

    return true
  }

  return {
    validateForReward,
  }
}
