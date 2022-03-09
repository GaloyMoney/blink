import axios from "axios"
import { UnknownIpFetcherServiceError } from "@domain/ipfetcher"
import { PROXY_CHECK_APIKEY } from "@config"

export const IpFetcher = (): IIpFetcherService => {
  const fetchIPInfo = async (ip: string): Promise<IPInfo | IpFetcherServiceError> => {
    try {
      const { data } = await axios.get(
        `https://proxycheck.io/v2/${ip}?key=${PROXY_CHECK_APIKEY}&vpn=1&asn=1`,
      )
      return { ...data[ip], status: data.status }
    } catch (err) {
      return new UnknownIpFetcherServiceError(err)
    }
  }
  return {
    fetchIPInfo,
  }
}
