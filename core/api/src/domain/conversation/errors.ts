import { DomainError, ErrorLevel } from "@/domain/shared"

export class ConversationError extends DomainError {}

export class UnknownConversationError extends ConversationError {
  level = ErrorLevel.Critical
}
