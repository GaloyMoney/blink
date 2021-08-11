import { GT } from "@graphql/index"
import VerifyCaptchaAndReturnOTP from "@core/auth-code-request"

import Phone from "../scalars/phone"
import AuthCodeRequestPayload from "../payloads/auth-code-request-payload"

const AuthCodeRequestInput = new GT.Input({
  name: "AuthCodeRequestInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    challengeCode: { type: GT.NonNull(GT.String) },
    validationCode: { type: GT.NonNull(GT.String) },
    secCode: { type: GT.NonNull(GT.String) },
  }),
})

const AuthCodeRequest = {
  type: GT.NonNull(AuthCodeRequestPayload),
  args: {
    input: { type: GT.NonNull(AuthCodeRequestInput) },
  },
  resolve: async (_, args, { logger, ip, geetest }) => {
    const {
      phone,
      challengeCode: geetestChallenge,
      validationCode: geetestValidate,
      secCode: geetestSeccode,
    } = args.input

    try {
      // TODO: redo this with use-case and errors pattern
      await VerifyCaptchaAndReturnOTP({
        phone,
        geetest,
        geetestChallenge,
        geetestValidate,
        geetestSeccode,
        logger,
        ip,
      })
      return {
        errors: [],
        success: true,
      }
    } catch (err) {
      return {
        errors: [{ message: err.message }],
        success: false,
      }
    }
  },
}

export default AuthCodeRequest
