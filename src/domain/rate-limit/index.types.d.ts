type RateLimitServiceError = import("./errors").RateLimitServiceError

type RateLimitPrefix =
  typeof import("./index").RateLimitPrefix[keyof typeof import("./index").RateLimitPrefix]

type RateLimitOptions = {
  points: number
  duration: Seconds
  blockDuration: Seconds
}

interface IRateLimitService {
  consume(key: string | number): Promise<true | RateLimitServiceError>
}
