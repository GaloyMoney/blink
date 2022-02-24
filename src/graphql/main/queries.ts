import { GT } from "@graphql/index"

import MeQuery from "@graphql/root/query/me"
import GlobalsQuery from "@graphql/root/query/globals"
import UsernameAvailableQuery from "@graphql/root/query/username-available"
import AccountDefaultWalletIdQuery from "@graphql/root/query/account-default-wallet-id"
import AccountDefaultWalletQuery from "@graphql/root/query/account-default-wallet"
import BusinessMapMarkersQuery from "@graphql/root/query/business-map-markers"
import MobileVersionsQuery from "@graphql/root/query/mobile-versions"
import QuizQuestionsQuery from "@graphql/root/query/quiz-questions"
import BtcPriceListQuery from "@graphql/root/query/btc-price-list"
import OnChainTxFeeQuery from "@graphql/root/query/on-chain-tx-fee-query"
import AccountApiKeysQuery from "@graphql/root/query/account-api-keys"
import BtcPriceQuery from "@graphql/root/query/btc-price"

const QueryType = GT.Object({
  name: "Query",
  fields: () => ({
    globals: GlobalsQuery,
    me: MeQuery,
    usernameAvailable: UsernameAvailableQuery,
    userDefaultWalletId: AccountDefaultWalletIdQuery, // FIXME: migrate to AccountDefaultWalletId
    accountDefaultWallet: AccountDefaultWalletQuery,
    businessMapMarkers: BusinessMapMarkersQuery,
    mobileVersions: MobileVersionsQuery,
    quizQuestions: QuizQuestionsQuery,
    btcPrice: BtcPriceQuery,
    btcPriceList: BtcPriceListQuery,
    onChainTxFee: OnChainTxFeeQuery,
    accountApiKeys: AccountApiKeysQuery,
  }),
})

export default QueryType
