import { addToEverySpan, SemanticAttributes, ENDUSER_ALIAS } from "@services/tracing"
import { GT } from "@graphql/index"

import { UserWithAccounts } from "@graphql/types/object/user"

const MeQuery = GT.Field({
  type: UserWithAccounts,
  resolve: async (_, __, { ip, domainUser }) =>
    addToEverySpan(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ENDUSER_ALIAS]: domainUser?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      () => domainUser,
    ),
})

export default MeQuery
