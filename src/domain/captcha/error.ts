import { DomainError, ErrorLevel } from "@domain/errors"

export class CaptchaError extends DomainError {}

export class CaptchaUserFailToPassError extends CaptchaError {}
export class UnknownCaptchaError extends CaptchaError {
  level = ErrorLevel.Critical
}
