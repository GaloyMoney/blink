type PartialResultType =
  (typeof import("./partial-result").PartialResultType)[keyof typeof import("./partial-result").PartialResultType]

type PartialResult<T> =
  | {
      result: T
      error?: undefined
      type: typeof import("./partial-result").PartialResultType.Ok
    }
  | {
      result: T
      error: ApplicationError
      type: typeof import("./partial-result").PartialResultType.Partial
    }
  | {
      result: null
      error: ApplicationError
      type: typeof import("./partial-result").PartialResultType.Err
    }

type ValueOf<T> = T[keyof T]

type ApplicationErrors = typeof import("./errors").ApplicationErrors
type ApplicationErrorKey = keyof ApplicationErrors

type ExtractInstanceType<T> = T extends new () => infer R ? R : never
type ApplicationError = ExtractInstanceType<ApplicationErrors[ApplicationErrorKey]>
