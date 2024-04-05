type RateLimitServiceError = import("./errors").RateLimitServiceError

type RateLimitPrefix =
  (typeof import("./index").RateLimitPrefix)[keyof typeof import("./index").RateLimitPrefix]

type RateLimitConfig = {
  key: RateLimitPrefix
  limits: RateLimitOptions
  error: typeof import("./errors").RateLimiterExceededError
}

type RateLimitOptions = {
  points: number
  duration: Seconds
  blockDuration: Seconds
}

interface IRateLimitService {
  consume(key: string): Promise<true | RateLimitServiceError>
  reset(key: string): Promise<true | RateLimitServiceError>
  reward(key: string): Promise<true | RateLimitServiceError>
}
