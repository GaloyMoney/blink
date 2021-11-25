import { GeetestError } from "@domain/geetest/error"

type GeeTestRegister = {
  success: number
  gt: string
  challenge: string
  new_captcha: boolean
}

type GeeTestType = {
  register: () => Promise<GeeTestRegister>
  validate: (
    challenge: string,
    validate: string,
    seccode: string,
  ) => Promise<boolean | GeetestError>
}
