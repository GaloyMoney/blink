import { GT } from "@graphql/index"
import CentAmountPayload from "@graphql/types/payload/cent-amount"

const IAccountLimit = GT.Interface({
  name: "AccountLimit",
  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmountPayload),
      description: `The current maximum limit for a given 24 hour period.`,
    },
    remainingLimit: {
      type: CentAmountPayload,
      description: `The amount of cents remaining below the limit for the current 24 hour period.`,
    },
  }),
})

export default IAccountLimit
