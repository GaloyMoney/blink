import { GT } from "@/graphql/index"
import Authorization from "@/graphql/public/types/object/authorization"

import { resolveScopes } from "@/domain/authorization"

const AuthorizationQuery = GT.Field<null, GraphQLPublicContextAuth>({
  type: GT.NonNull(Authorization),
  description: "Retrieve the list of scopes permitted for the user's token or API key",
  resolve: async (_source, _args, { domainAccount, scope }) => {
    return {
      scopes: resolveScopes({ account: domainAccount, scopes: scope }),
    }
  },
})

export default AuthorizationQuery
