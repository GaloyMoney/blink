export const parseIps = (ips: undefined | string | string[]): IpAddress | undefined => {
  if (!ips) return undefined

  let ip: IpAddress | undefined = undefined

  if (ips && Array.isArray(ips) && ips.length) {
    ip = ips[0] as IpAddress
  } else if (typeof ips === "string") {
    ip = ips as IpAddress
  }

  return ip
}
