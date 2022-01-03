import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ENDUSER_ALIAS,
  ENDACCOUNT_DEFAULTWALLETID,
} from "@services/tracing"
import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/graphql-user"

const MeQuery = GT.Field({
  type: GraphQLUser,
  resolve: async (
    _,
    __,
    {
      ip,
      domainUser,
      domainAccount,
    }: { ip: IpAddress; domainUser: User; domainAccount: Account },
  ) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ENDUSER_ALIAS]: domainAccount?.username,
        [ENDACCOUNT_DEFAULTWALLETID]: domainAccount?.defaultWalletId,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      () => domainUser,
    ),
})

export default MeQuery
