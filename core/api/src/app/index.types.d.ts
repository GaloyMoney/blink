type PartialResult<T> = {
  result: T | null
  error?: ApplicationError
  partialResult: true
}

type RawPaginationArgs = {
  first?: number
  last?: number
  before?: string
  after?: string
}

type ValueOf<T> = T[keyof T]

type ApplicationErrors = typeof import("./errors").ApplicationErrors
type ApplicationErrorKey = keyof ApplicationErrors

type ExtractInstanceType<T> = T extends new () => infer R ? R : never
type ApplicationError = ExtractInstanceType<ApplicationErrors[ApplicationErrorKey]>
