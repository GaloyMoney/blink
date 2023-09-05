import {
  MissingIPMetadataError,
  UnauthorizedIPMetadataASNForRewardError,
  UnauthorizedIPMetadataCountryForRewardError,
  UnauthorizedIPMetadataProxyForRewardError,
} from "@domain/errors"

export const IPMetadataAuthorizer = ({
  denyCountries,
  allowCountries,
  denyASNs,
  allowASNs,
}: IPMetadataAuthorizerArgs): IPMetadataAuthorizer => {
  const authorize = (ipMetadata?: IPType): true | AuthorizationError => {
    if (!ipMetadata || !ipMetadata.isoCode || !ipMetadata.asn)
      return new MissingIPMetadataError()

    if (ipMetadata.proxy) return new UnauthorizedIPMetadataProxyForRewardError()

    const isoCode = ipMetadata.isoCode.toUpperCase()
    const allowedCountry = allowCountries.length <= 0 || allowCountries.includes(isoCode)
    const deniedCountry = denyCountries.length > 0 && denyCountries.includes(isoCode)
    if (!allowedCountry || deniedCountry)
      return new UnauthorizedIPMetadataCountryForRewardError()

    const asn = ipMetadata.asn.toUpperCase()
    const allowedASN = allowASNs.length <= 0 || allowASNs.includes(asn)
    const deniedASN = denyASNs.length > 0 && denyASNs.includes(asn)
    if (!allowedASN || deniedASN) return new UnauthorizedIPMetadataASNForRewardError()

    return true
  }

  return { authorize }
}
