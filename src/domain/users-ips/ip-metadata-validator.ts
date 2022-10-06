import {
  MissingIPMetadataError,
  InvalidIPMetadataCountryError,
  InvalidIPMetadataProxyError,
  InvalidIPMetadataASNError,
} from "@domain/errors"

const defaultMetadataConfig = {
  denyIPCountries: [],
  allowIPCountries: [],
  denyASNs: [],
  allowASNs: [],
}

export const IPMetadataValidator = (
  metadataConfig?: IPMetadataValidatorArgs,
): IPMetadataValidator => {
  const validateForReward = (ipMetadata?: IPType): true | ValidationError => {
    if (!ipMetadata || !ipMetadata.isoCode || !ipMetadata.asn)
      return new MissingIPMetadataError()

    if (ipMetadata.proxy) return new InvalidIPMetadataProxyError()

    const { denyIPCountries, allowIPCountries, denyASNs, allowASNs } =
      metadataConfig || defaultMetadataConfig
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

  const validateForNewAccount = (ipMetadata?: IPInfo): true | ValidationError => {
    if (ipMetadata && ipMetadata.proxy) return new InvalidIPMetadataProxyError()

    return true
  }

  return {
    validateForReward,
    validateForNewAccount,
  }
}
