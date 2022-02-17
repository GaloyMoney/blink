type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]
type AuthorizationError = import("./errors").AuthorizationError
type RepositoryError = import("./errors").RepositoryError
type ValidationError = import("./errors").ValidationError
type LimitsExceededError = import("./errors").LimitsExceededError
type TwoFALimitsExceededError = import("./errors").TwoFALimitsExceededError
type NotImplementedError = import("./errors").NotImplementedError
type NotReachableError = import("./errors").NotReachableError
