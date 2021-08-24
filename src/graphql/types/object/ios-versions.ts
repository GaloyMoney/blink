import { GT } from "@graphql/index"

const IosVersions = new GT.Object({
  name: "IosVersions",
  fields: () => ({
    currentSupported: { type: GT.NonNull(GT.Int) },
    minSupported: { type: GT.NonNull(GT.Int) },
  }),
})

export default IosVersions
