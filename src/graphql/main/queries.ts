import MeQuery from "@graphql/root/query/me"
import { GT } from "@graphql/index"
import GlobalsQuery from "@graphql/root/query/globals"
import WalletNameAvailableQuery from "@graphql/root/query/wallet-name-available"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    globals: GlobalsQuery,
    me: MeQuery,
    walletNameAvailable: WalletNameAvailableQuery,
  }),
})

export default QueryType
