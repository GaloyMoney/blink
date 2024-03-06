import { GT } from "@/graphql/index"
import Scope from "@/graphql/shared/types/scalar/scope"

const UserAuthorization = GT.Object({
  name: "UserAuthorization",
  fields: () => ({
    scopes: { type: GT.NonNullList(Scope) },
  }),
})

export default UserAuthorization
