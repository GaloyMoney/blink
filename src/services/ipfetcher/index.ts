import axios from "axios"
import { UnknownIpFetcherServiceError } from "@domain/ipfetcher"
import { PROXY_CHECK_APIKEY } from "@config"

export const IpFetcher = (): IIpFetcherService => {
  const fetchIPInfo = async (ip: string): Promise<IPInfo | IpFetcherServiceError> => {
    try {
      const params: { [id: string]: string } = {
        vpn: "1",
        asn: "1",
        time: "1",
        risk: "1",
      }

      if (PROXY_CHECK_APIKEY) {
        params["key"] = PROXY_CHECK_APIKEY
      }

      const { data } = await axios.request({
        url: `https://proxycheck.io/v2/${ip}`,
        params,
      })

      const proxy = !!(data[ip] && data[ip].proxy && data[ip].proxy === "yes")
      const isoCode = data[ip] && data[ip].isocode

      return { ...data[ip], isoCode, proxy, status: data.status }
    } catch (err) {
      return new UnknownIpFetcherServiceError(err)
    }
  }
  return {
    fetchIPInfo,
  }
}
