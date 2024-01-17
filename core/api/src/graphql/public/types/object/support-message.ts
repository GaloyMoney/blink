import Timestamp from "@/graphql/shared/types/scalar/timestamp"

import { GT } from "@/graphql/index"

const SupportMessage = GT.Object({
  name: "SupportMessage",
  fields: () => ({
    id: { type: GT.NonNullID },
    message: {
      type: GT.NonNull(GT.String),
    },
    role: {
      // "user" | "assistant"
      type: GT.NonNull(GT.String),
    },
    timestamp: { type: GT.NonNull(Timestamp) },
  }),
})

export default SupportMessage
