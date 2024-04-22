import { DomainError, ErrorLevel } from "@/domain/shared"

export class SupportError extends DomainError {}

export class UnknownSupportError extends SupportError {
  level = ErrorLevel.Critical
}

export class UnknownPineconeError extends SupportError {
  level = ErrorLevel.Critical
}

export class ChatAssistantError extends SupportError {}

export class UnknownChatAssistantError extends ChatAssistantError {
  level = ErrorLevel.Critical
}
