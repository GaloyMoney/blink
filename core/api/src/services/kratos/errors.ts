import { LikelyNoUserWithThisPhoneExistError } from "@/domain/authentication/errors"
import {
  AuthenticationKratosError,
  AuthorizationKratosError,
  UnknownKratosError,
} from "@/domain/kratos"

export const handleKratosErrors = (err: Error | unknown) => {
  if (!(err instanceof Error)) {
    return new UnknownKratosError(err)
  }

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(err.message)
  switch (true) {
    case match(KnownKratosErrorDetails.BadRequestError):
      return new LikelyNoUserWithThisPhoneExistError(err.message)
    case match(KnownKratosErrorDetails.UnauthorizedError):
      return new AuthenticationKratosError(err.message)
    case match(KnownKratosErrorDetails.ForbiddenError):
      return new AuthorizationKratosError(err.message)
    default:
      return new UnknownKratosError(err.message)
  }
}

const KnownKratosErrorDetails = {
  BadRequestError: /Request failed with status code 400/,
  UnauthorizedError: /Request failed with status code 401/,
  ForbiddenError: /Request failed with status code 403/,
} as const
