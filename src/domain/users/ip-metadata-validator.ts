import { MissingIpMetadataError, InvalidIpMetadataTypeError } from "@domain/errors"
import { getBlockListedASNs, getAllowListedCountries } from "@config"

export const IpMetadataValidator = (): IpMetadataValidator => {
  const validate = (userIP: UserIPs): true | ValidationError => {
    const blockListedASNs = getBlockListedASNs()
    const allowListedCountries = getAllowListedCountries()

    const lastIP = userIP.lastIPs.sort(
      (a, b) => b.lastConnection.getTime() - a.lastConnection.getTime(),
    )[0]

    if (!lastIP) return new MissingIpMetadataError()

    if (lastIP.proxy && lastIP.proxy == "yes") return new InvalidIpMetadataTypeError()

    if (lastIP.asn && blockListedASNs.length && blockListedASNs.indexOf(lastIP.asn) != -1)
      return new InvalidIpMetadataTypeError()

    if (
      lastIP.country &&
      allowListedCountries.length &&
      allowListedCountries.indexOf(lastIP.country) == -1
    )
      return new InvalidIpMetadataTypeError()

    return true
  }

  return {
    validate,
  }
}
