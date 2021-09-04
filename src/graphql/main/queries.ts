import MeQuery from "@graphql/root/query/me"
import { GT } from "@graphql/index"
import GlobalsQuery from "@graphql/root/query/globals"
import WalletNameAvailableQuery from "@graphql/root/query/wallet-name-available"
import BusinessMapMarkersQuery from "@graphql/root/query/business-map-markers"
import MobileVersionsQuery from "@graphql/root/query/mobile-versions"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    globals: GlobalsQuery,
    me: MeQuery,
    walletNameAvailable: WalletNameAvailableQuery,
    businessMapMarkers: BusinessMapMarkersQuery,
    mobileVersions: MobileVersionsQuery,
  }),
})

export default QueryType
