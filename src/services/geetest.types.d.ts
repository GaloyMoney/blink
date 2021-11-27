type GeetestError = import("@domain/captcha/error").GeetestError
type UnknownGeetestError = import("@domain/captcha/error").UnknownGeetestError

type GeetestRegister = {
  success: number
  gt: string
  challenge: string
  newCaptcha: boolean
}

type GeetestType = {
  register: () => Promise<UnknownGeetestError | GeetestRegister>
  validate: (
    challenge: string,
    validate: string,
    seccode: string,
  ) => Promise<boolean | GeetestError>
}
