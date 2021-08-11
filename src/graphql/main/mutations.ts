import { GT } from "../index"

import AuthCodeRequest from "@graphql/types/mutations/auth-code-request"
import CaptchaChallengeCreate from "@graphql/types/mutations/captcha-challenge-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "../types/mutations/ln-noamount-invoice-create-on-behalf-of-recipient"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
    captchaChallengeCreate: CaptchaChallengeCreate,
    authCodeRequest: AuthCodeRequest,
  }),
})

export default MutationType
