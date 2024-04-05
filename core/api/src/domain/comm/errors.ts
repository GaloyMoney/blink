import { DomainError, ErrorLevel } from "@/domain/shared"

export class MattermostError extends DomainError {
  level = ErrorLevel.Critical
}
