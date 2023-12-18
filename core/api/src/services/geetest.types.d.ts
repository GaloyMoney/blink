type CaptchaError = import("@/domain/captcha/errors").CaptchaError
type UnknownCaptchaError = import("@/domain/captcha/errors").UnknownCaptchaError

type GeetestRegister = {
  success: number
  gt: string
  challenge: string
  newCaptcha: boolean
}

type GeetestType = {
  register: () => Promise<UnknownCaptchaError | GeetestRegister>
  validate: (
    challenge: string,
    validate: string,
    seccode: string,
  ) => Promise<true | CaptchaError>
}

declare module "@galoy/gt3-server-node-express-sdk"
