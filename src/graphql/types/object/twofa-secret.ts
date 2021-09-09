import { GT } from "@graphql/index"

const TwoFASecret = new GT.Object({
  name: "TwoFASecret",
  fields: () => ({
    secret: { type: GT.NonNull(GT.String) },
    uri: { type: GT.NonNull(GT.String) },
  }),
})

export default TwoFASecret
