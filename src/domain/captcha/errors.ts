import { DomainError, ErrorLevel } from "@domain/shared"

export class CaptchaError extends DomainError {}

export class CaptchaUserFailToPassError extends CaptchaError {}
export class UnknownCaptchaError extends CaptchaError {
  level = ErrorLevel.Critical
}
