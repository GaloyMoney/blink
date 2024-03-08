import { GT } from "@/graphql"
import IError from "@/graphql/shared/types/abstract/error"

export const TriggerMarketingNotificationPayload = GT.Object({
  name: "TriggerMarketingNotificationPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      type: GT.NonNull(GT.Boolean),
    },
  }),
})
