type GeeTestRegister = {
  success: number
  gt: string
  challenge: string
  new_captcha: boolean
}

type GeeTestType = {
  register: () => Promise<GeeTestRegister>
  validate: (challenge: unknown, validate: unknown, seccode: unknown) => Promise<boolean>
}
