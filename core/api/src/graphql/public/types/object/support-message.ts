import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import SupportRole from "@/graphql/public/types/scalar/support-role"

import { GT } from "@/graphql/index"

const SupportMessage = GT.Object({
  name: "SupportMessage",
  fields: () => ({
    id: { type: GT.NonNullID },
    message: {
      type: GT.NonNull(GT.String),
    },
    role: {
      type: GT.NonNull(SupportRole),
    },
    timestamp: { type: GT.NonNull(Timestamp) },
  }),
})

export default SupportMessage
