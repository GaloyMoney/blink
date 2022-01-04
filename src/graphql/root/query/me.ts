import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ENDUSER_ALIAS,
  ENDUSER_PUBLICID,
} from "@services/tracing"
import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/types/object/graphql-user"
import getUuidByString from "uuid-by-string"

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
        [ENDUSER_PUBLICID]: domainUser?.id
          ? getUuidByString(domainUser?.id)
          : domainUser?.id,
        [ENDUSER_ALIAS]: domainAccount?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      () => domainUser,
    ),
})

export default MeQuery
