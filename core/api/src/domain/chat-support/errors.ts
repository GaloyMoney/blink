import { DomainError, ErrorLevel } from "@/domain/shared"

export class ChatSupportError extends DomainError {}

export class ChatSupportNotFoundError extends ChatSupportError {}

export class UnknownChatSupportError extends ChatSupportError {
  level = ErrorLevel.Critical
}
