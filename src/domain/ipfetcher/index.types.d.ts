type IpFetcherError = import("./errors").IpFetcherError
type IpFetcherServiceError = import("./errors").IpFetcherServiceError

declare const ipAddressSymbol: unique symbol
type IpAddress = string & { [ipAddressSymbol]: never }

type IPInfo = {
  provider: string
  country: string
  region: string
  city: string
  type: string
  status: string
}

interface IIpFetcherService {
  fetchIPInfo(ip: IpAddress): Promise<IPInfo | IpFetcherServiceError>
}
