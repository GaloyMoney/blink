import { GT } from "@graphql/index"
import CentAmount from "@graphql/types/scalar/cent-amount"

const IAccountLimit = GT.Interface({
  name: "AccountLimit",
  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given 24 hour period.`,
    },
    remainingLimit: {
      type: CentAmount,
      description: `The amount of cents remaining below the limit for the current 24 hour period.`,
    },
  }),
})

export default IAccountLimit
