import { GT } from "@graphql/index"

import MeQuery from "@graphql/root/query/me"
import GlobalsQuery from "@graphql/root/query/globals"
import BtcPriceQuery from "@graphql/root/query/btc-price"
import CurrencyListQuery from "@graphql/root/query/currency-list"
import BtcPriceListQuery from "@graphql/root/query/btc-price-list"
import QuizQuestionsQuery from "@graphql/root/query/quiz-questions"
import MobileVersionsQuery from "@graphql/root/query/mobile-versions"
import OnChainTxFeeQuery from "@graphql/root/query/on-chain-tx-fee-query"
import OnChainUsdTxFeeQuery from "@graphql/root/query/on-chain-usd-tx-fee-query"
import UsernameAvailableQuery from "@graphql/root/query/username-available"
import BusinessMapMarkersQuery from "@graphql/root/query/business-map-markers"
import AccountDefaultWalletQuery from "@graphql/root/query/account-default-wallet"
import AccountDefaultWalletIdQuery from "@graphql/root/query/account-default-wallet-id"
import LnInvoicePaymentStatusQuery from "@graphql/root/query/ln-invoice-payment-status"

export const queryFields = {
  unauthed: {
    globals: GlobalsQuery,
    usernameAvailable: UsernameAvailableQuery,
    userDefaultWalletId: AccountDefaultWalletIdQuery, // FIXME: migrate to AccountDefaultWalletId
    accountDefaultWallet: AccountDefaultWalletQuery,
    businessMapMarkers: BusinessMapMarkersQuery,
    currencyList: CurrencyListQuery,
    mobileVersions: MobileVersionsQuery,
    quizQuestions: QuizQuestionsQuery,
    btcPrice: BtcPriceQuery,
    btcPriceList: BtcPriceListQuery,
    lnInvoicePaymentStatus: LnInvoicePaymentStatusQuery,
  },
  authed: {
    atAccountLevel: {
      me: MeQuery,
    },
    atWalletLevel: {
      onChainTxFee: OnChainTxFeeQuery,
      onChainUsdTxFee: OnChainUsdTxFeeQuery,
    },
  },
} as const

export const QueryType = GT.Object({
  name: "Query",
  fields: {
    ...queryFields.unauthed,
    ...queryFields.authed.atAccountLevel,
    ...queryFields.authed.atWalletLevel,
  },
})
