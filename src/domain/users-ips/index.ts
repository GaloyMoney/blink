import { ExpressContext } from "apollo-server-express"

export const parseIps = (context: undefined | ExpressContext): IpAddress | undefined => {
  if (!context) return undefined

  const ips =
    process.env.NODE_ENV === "development"
      ? context.req?.ip
      : context.req?.headers["x-real-ip"]

  let ip: IpAddress | undefined = undefined

  if (ips && Array.isArray(ips) && ips.length) {
    ip = ips[0] as IpAddress
  } else if (typeof ips === "string") {
    ip = ips as IpAddress
  }

  return ip
}
