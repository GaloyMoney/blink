import MeQuery from "@graphql/root/query/me"
import { GT } from "@graphql/index"
import GlobalsQuery from "@graphql/root/query/globals"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    globals: GlobalsQuery,
    me: MeQuery,
  }),
})

export default QueryType
