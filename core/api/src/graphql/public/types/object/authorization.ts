import { GT } from "@/graphql/index"
import Scope from "@/graphql/shared/types/scalar/scope"

const Authorization = GT.Object({
  name: "Authorization",
  fields: () => ({
    scopes: { type: GT.NonNullList(Scope) },
  }),
})

export default Authorization
