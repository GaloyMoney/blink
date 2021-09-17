import { GT } from "@graphql/index"
import TwoFAGeneratePayload from "@graphql/types/payload/twofa-generate"

const TwoFAGenerateMutation = GT.Field({
  type: GT.NonNull(TwoFAGeneratePayload),
  resolve: async (_, __, { wallet }) => {
    try {
      const twoFASecret = await wallet.generate2fa()
      return { errors: [], twoFASecret }
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }
  },
})

export default TwoFAGenerateMutation
