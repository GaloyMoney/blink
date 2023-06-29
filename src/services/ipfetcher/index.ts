import axios from "axios"
import { UnknownIpFetcherServiceError } from "@domain/ipfetcher"

export const IpFetcher = (apiKey?: string): IIpFetcherService => {
  const fetchIPInfo = async (ip: string): Promise<IPInfo | IpFetcherServiceError> => {
    try {
      const params: { [id: string]: string } = {
        vpn: "1",
        asn: "1",
        time: "1",
        risk: "1",
      }

      if (apiKey) {
        params["key"] = apiKey
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
