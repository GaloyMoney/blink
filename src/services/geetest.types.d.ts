type GeetestError = import("@domain/geetest/error").GeetestError
type UnknownGeetestError = import("@domain/geetest/error").UnknownGeetestError

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
