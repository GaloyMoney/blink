import { DomainError, ErrorLevel } from "@/domain/shared"

export class PubSubError extends DomainError {}

export class PubSubServiceError extends PubSubError {}
export class UnknownPubSubError extends PubSubError {
  level = ErrorLevel.Critical
}
