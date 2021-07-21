export const RegisterCaptchaGeetest = async ({
  geetest,
  logger,
  ip,
}: {
  geetest: GeeTestType
  logger: Logger
  ip: string
}): Promise<Error | Record<string, unknown>> => {
  logger.info({ ip }, "RegisterCaptchaGeetest called")

  try {
    const { success, gt, challenge, new_captcha: newCaptcha } = await geetest.register()
    return { success, gt, challenge, newCaptcha }
  } catch (err) {
    logger.error({ err }, "impossible to register geetest")
    return err
  }
}
