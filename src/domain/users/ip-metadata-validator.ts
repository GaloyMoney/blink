import { MissingIpMetadataError, InvalidIpMetadataTypeError } from "@domain/errors"
import { getBlacklistedASNs, getWhitelistedCountries } from "@config/app"

export const IpMetadataValidator = (): IpMetadataValidator => {
  const validate = (userIP: UserIPs): true | ApplicationError => {
    const blacklistedASNs = getBlacklistedASNs()
    const whitelistedCountries = getWhitelistedCountries()

    const lastIP = userIP.lastIPs.sort(
      (a, b) => b.lastConnection.getTime() - a.lastConnection.getTime(),
    )[0]

    if (!lastIP) return new MissingIpMetadataError()

    if (lastIP.asn && blacklistedASNs.length && blacklistedASNs.indexOf(lastIP.asn) != -1)
      return new InvalidIpMetadataTypeError()

    if (
      lastIP.country &&
      whitelistedCountries.length &&
      whitelistedCountries.indexOf(lastIP.country) == -1
    )
      return new InvalidIpMetadataTypeError()

    return true
  }

  return {
    validate,
  }
}
