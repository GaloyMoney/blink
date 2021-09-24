import { CaptchaFailedError } from "./error"
import { requestPhoneCode } from "./text"

export const verifyCaptchaAndReturnOTP = async ({
  phone,
  geetest,
  geetestChallenge,
  geetestValidate,
  geetestSeccode,
  logger,
  ip,
}: {
  phone: string
  geetest: GeeTestType
  geetestChallenge: string
  geetestValidate: string
  geetestSeccode: string
  logger: Logger
  ip: string
}): Promise<boolean> => {
  logger.info({ phone, ip }, "RequestPhoneCodeGeetest called")

  let verifySuccess = false
  try {
    verifySuccess = await geetest.validate(
      geetestChallenge,
      geetestValidate,
      geetestSeccode,
    )
    if (!verifySuccess) {
      throw new Error("Could not validate captcha")
    }
  } catch (err) {
    throw new CaptchaFailedError("Captcha Invalid", {
      logger,
      geetestChallenge,
      geetestValidate,
      geetestSeccode,
      err,
    })
  }

  return requestPhoneCode({
    phone,
    logger,
    ip,
  })
}

export default verifyCaptchaAndReturnOTP
