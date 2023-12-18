import { getGeetestConfig } from "@/config"
import Geetest from "@/services/geetest"

export const registerCaptchaGeetest = async () => {
  const geeTestConfig = getGeetestConfig()
  const geetest = Geetest(geeTestConfig)

  const registerCaptchaGeetest = await geetest.register()
  if (registerCaptchaGeetest instanceof Error) return registerCaptchaGeetest

  const { success, gt, challenge, newCaptcha } = registerCaptchaGeetest

  return { success, gt, challenge, newCaptcha }
}
