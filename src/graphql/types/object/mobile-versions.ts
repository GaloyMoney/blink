import { GT } from "@graphql/index"

const MobileVersions = GT.Object({
  name: "MobileVersions",
  fields: () => ({
    platform: { type: GT.NonNull(GT.String) },
    currentSupported: { type: GT.NonNull(GT.Int) },
    minSupported: { type: GT.NonNull(GT.Int) },
  }),
})

export default MobileVersions
