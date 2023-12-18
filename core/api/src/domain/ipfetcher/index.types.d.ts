type IpFetcherError = import("./errors").IpFetcherError
type IpFetcherServiceError = import("./errors").IpFetcherServiceError

type IpAddress = string & { readonly brand: unique symbol }
type IPInfo = {
  provider: string
  country: string
  isoCode: string
  region: string
  city: string
  type: string
  asn: string
  proxy: boolean
}

interface IIpFetcherService {
  fetchIPInfo(ip: IpAddress): Promise<IPInfo | IpFetcherServiceError>
}
