import { GT } from "@graphql/index"

const AndroidVersions = new GT.Object({
  name: "AndroidVersions",
  fields: () => ({
    currentSupported: { type: GT.NonNull(GT.Int) },
    minSupported: { type: GT.NonNull(GT.Int) },
  }),
})

export default AndroidVersions
