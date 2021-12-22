export const parseIps = (
  headers: null | NodeJS.Dict<string | string[]>,
): IpAddress | null => {
  if (!headers) return null

  const ips = headers["x-real-ip"]

  let ip: IpAddress | null = null

  if (ips && Array.isArray(ips) && ips.length) {
    ip = ips[0] as IpAddress
  } else if (typeof ips === "string") {
    ip = ips as IpAddress
  }

  return ip
}
