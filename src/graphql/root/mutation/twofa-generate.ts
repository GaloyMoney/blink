import { generate2fa } from "@app/users"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import TwoFAGeneratePayload from "@graphql/types/payload/twofa-generate"

const TwoFAGenerateMutation = GT.Field({
  type: GT.NonNull(TwoFAGeneratePayload),
  resolve: async (_, __, { domainUser }) => {
    const twoFASecret = await generate2fa(domainUser.id)
    if (twoFASecret instanceof Error) {
      const appErr = mapError(twoFASecret)
      return { errors: [{ message: appErr.message }] }
    }

    return { errors: [], twoFASecret }
  },
})

export default TwoFAGenerateMutation
