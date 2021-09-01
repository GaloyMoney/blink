type IpFetcherServiceError = import("./errors").IpFetcherServiceError

type IPInfo = {
  provider: string
  country: string
  region: string
  city: string
  type: string
  status: string
}

interface IIpFetcherService {
  fetchIPInfo(ip: string): Promise<IPInfo | IpFetcherServiceError>
}
