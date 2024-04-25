import Timestamp from "@/graphql/shared/types/scalar/timestamp"

import { GT } from "@/graphql/index"

const MobileSession = GT.Object({
  name: "MobileSession",
  fields: () => ({
    id: { type: GT.NonNullID },
    issuedAt: { type: GT.NonNull(Timestamp) },
    expiresAt: { type: GT.NonNull(Timestamp) },
  }),
})

export default MobileSession
