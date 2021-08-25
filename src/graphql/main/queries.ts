import MeQuery from "@graphql/root/query/me"
import { GT } from "@graphql/index"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    me: MeQuery,
  }),
})

export default QueryType
