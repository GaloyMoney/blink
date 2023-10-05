import { DomainError, ErrorLevel } from "@/domain/shared"

export class SvixEventError extends DomainError {}

export class UnknownSvixError extends SvixEventError {
  level = ErrorLevel.Critical
}

interface SvixErrorBody {
  code: string
  detail: string
}

export interface SvixError extends Error {
  code: number
  body: SvixErrorBody
}
