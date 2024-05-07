import Timestamp from "@/graphql/shared/types/scalar/timestamp"

import { GT } from "@/graphql/index"

const Delegation = GT.Object({
  name: "Delegation",
  fields: () => ({
    app: { type: GT.NonNull(GT.String) },
    handledAt: { type: GT.NonNull(Timestamp) },
    remember: { type: GT.NonNull(GT.Boolean) },
    scope: { type: GT.NonNullList(GT.String) },
  }),
})

export default Delegation
