type PartialResult<T> = {
  result: T | null
  error?: ApplicationError
  partialResult: true
}

type ValueOf<T> = T[keyof T]

type ApplicationErrors = typeof import("./errors").ApplicationErrors
type ApplicationErrorKey = keyof ApplicationErrors

type ExtractInstanceType<T> = T extends new () => infer R ? R : never
type ApplicationError = ExtractInstanceType<ApplicationErrors[ApplicationErrorKey]>
