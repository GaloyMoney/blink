import { GT } from "@graphql/index"
import CentAmount from "@graphql/types/scalar/cent-amount"
import Seconds from "@graphql/types/scalar/seconds"

const IRollingAccountLimit = GT.Interface({
  name: "RollingAccountLimit",
  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given time interval.`,
    },
    remainingLimit: {
      type: CentAmount,
      description: `The amount of cents remaining below the limit for the current time interval.`,
    },
    interval: {
      type: Seconds,
      description: `The rolling time interval in seconds that the limits would apply for.`,
    },
  }),
})

export default IRollingAccountLimit
