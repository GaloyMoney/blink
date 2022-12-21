type AuthorizationError = import("./errors").AuthorizationError
type RepositoryError = import("./errors").RepositoryError
type LimitsExceededError = import("./errors").LimitsExceededError
type NotImplementedError = import("./errors").NotImplementedError
type NotReachableError = import("./errors").NotReachableError

type LimitsExceededErrorConstructor = typeof import("./errors").LimitsExceededError
