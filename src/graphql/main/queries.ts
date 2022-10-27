import { GT } from "@graphql/index"

import MeQuery from "@graphql/root/query/me"
import GlobalsQuery from "@graphql/root/query/globals"
import BtcPriceQuery from "@graphql/root/query/btc-price"
import BtcPriceListQuery from "@graphql/root/query/btc-price-list"
import QuizQuestionsQuery from "@graphql/root/query/quiz-questions"
import MobileVersionsQuery from "@graphql/root/query/mobile-versions"
import OnChainTxFeeQuery from "@graphql/root/query/on-chain-tx-fee-query"
import UsernameAvailableQuery from "@graphql/root/query/username-available"
import BusinessMapMarkersQuery from "@graphql/root/query/business-map-markers"
import AccountDefaultWalletQuery from "@graphql/root/query/account-default-wallet"
import AccountDefaultWalletIdQuery from "@graphql/root/query/account-default-wallet-id"
import LnInvoicePaymentStatusQuery from "@graphql/root/query/ln-invoice-payment-status"

const fields = {
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
  lnInvoicePaymentStatus: LnInvoicePaymentStatusQuery,
} as const

const QueryType = GT.Object({
  name: "Query",
  fields,
})

export default QueryType
