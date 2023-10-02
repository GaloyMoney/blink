import ipaddr from "ipaddr.js"

export const parseIps = (
  ips: undefined | string | string[] | unknown,
): IpAddress | undefined => {
  if (!ips) return undefined

  if (Array.isArray(ips) && ips.length) {
    return toIpAddress(ips[0])
  }

  if (typeof ips === "string") {
    if (ips.includes(",")) return toIpAddress(ips.split(",")[0])
    return toIpAddress(ips)
  }

  return undefined
}

const toIpAddress = (ip: string | undefined): IpAddress | undefined => {
  if (!ip) return undefined

  const ipTrimmed = ip.trim()

  if (!ipaddr.isValid(ipTrimmed)) {
    return undefined
  }

  return ipTrimmed as IpAddress
}

export const isPrivateIp = (ip: string): boolean => {
  const convertedToV4 = ipaddr.process(ip.trim()).toString()
  const range = ipaddr.IPv4.parse(convertedToV4).range()
  return range === "private" || range === "loopback"
}
