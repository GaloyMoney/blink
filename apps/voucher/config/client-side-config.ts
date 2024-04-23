import { env } from "@/env"

export const getClientSideConfig = (): {
  coreGqlUrl: string
  voucherUrl: string
} => {
  const isServer = typeof window === "undefined" ? false : true

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    isServer
  ) {
    return {
      coreGqlUrl: env.NEXT_PUBLIC_CORE_URL,
      voucherUrl: env.NEXT_PUBLIC_VOUCHER_URL,
    }
  }

  const hostname = new URL(window.location.href).hostname

  const hostPartsApi = hostname.split(".")
  hostPartsApi[0] = "api"
  const coreGqlUrl = `https://${hostPartsApi.join(".")}/graphql`

  const hostPartsSelf = hostname.split(".")
  hostPartsSelf[0] = "voucher"
  const voucherUrl = `https://${hostPartsSelf.join(".")}`

  return {
    coreGqlUrl,
    voucherUrl,
  }
}
