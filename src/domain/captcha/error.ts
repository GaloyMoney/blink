export class CaptchaError extends Error {
  name = this.constructor.name
}

export class CaptchaUserFailToPassError extends CaptchaError {}
export class UnknownCaptchaError extends CaptchaError {}
