import { GT } from "@/graphql/index"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"
import Seconds from "@/graphql/public/types/scalar/seconds"

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
    interval: {
      type: Seconds,
      description: `The rolling time interval in seconds that the limits would apply for.`,
    },
  }),
})

export default IAccountLimit
