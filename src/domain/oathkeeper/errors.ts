import { DomainError, ErrorLevel } from "@domain/shared"

export class OathkeeperError extends DomainError {}

export class OathkeeperUnauthorizedServiceError extends OathkeeperError {}

export class OathkeeperForbiddenServiceError extends OathkeeperError {
  level = ErrorLevel.Critical
}

export class UnknownOathkeeperServiceError extends OathkeeperError {
  level = ErrorLevel.Critical
}
