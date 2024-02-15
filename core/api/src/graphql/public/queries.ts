import { GT } from "@/graphql/index"

import MeQuery from "@/graphql/public/root/query/me"
import GlobalsQuery from "@/graphql/public/root/query/globals"
import CurrencyListQuery from "@/graphql/public/root/query/currency-list"
import BtcPriceListQuery from "@/graphql/public/root/query/btc-price-list"
import RealtimePriceQuery from "@/graphql/public/root/query/realtime-price"
import MobileVersionsQuery from "@/graphql/public/root/query/mobile-versions"
import OnChainTxFeeQuery from "@/graphql/public/root/query/on-chain-tx-fee-query"
import OnChainUsdTxFeeQuery from "@/graphql/public/root/query/on-chain-usd-tx-fee-query"
import OnChainUsdTxFeeAsBtcDenominatedQuery from "@/graphql/public/root/query/on-chain-usd-tx-fee-query-as-sats"
import UsernameAvailableQuery from "@/graphql/public/root/query/username-available"
import BusinessMapMarkersQuery from "@/graphql/public/root/query/business-map-markers"
import AccountDefaultWalletQuery from "@/graphql/public/root/query/account-default-wallet"
import AccountDefaultWalletByUsernameQuery from "@/graphql/public/root/query/account-default-wallet-by-username"
import AccountDefaultWalletIdQuery from "@/graphql/public/root/query/account-default-wallet-id"
import LnInvoicePaymentStatusQuery from "@/graphql/public/root/query/ln-invoice-payment-status"
import LnInvoicePaymentStatusByHashQuery from "@/graphql/public/root/query/ln-invoice-payment-status-by-hash"
import LnInvoicePaymentStatusByPaymentRequestQuery from "@/graphql/public/root/query/ln-invoice-payment-status-by-payment-request"

export const queryFields = {
  unauthed: {
    globals: GlobalsQuery,
    usernameAvailable: UsernameAvailableQuery,
    userDefaultWalletId: AccountDefaultWalletIdQuery, // FIXME: migrate to AccountDefaultWalletId
    accountDefaultWallet: AccountDefaultWalletQuery,
    accountDefaultWalletByUsername: AccountDefaultWalletByUsernameQuery,
    businessMapMarkers: BusinessMapMarkersQuery,
    currencyList: CurrencyListQuery,
    mobileVersions: MobileVersionsQuery,
    realtimePrice: RealtimePriceQuery,
    btcPriceList: BtcPriceListQuery,
    lnInvoicePaymentStatus: LnInvoicePaymentStatusQuery,
    lnInvoicePaymentStatusByHash: LnInvoicePaymentStatusByHashQuery,
    lnInvoicePaymentStatusByPaymentRequest: LnInvoicePaymentStatusByPaymentRequestQuery,
  },
  authed: {
    atAccountLevel: {
      me: MeQuery,
    },
    atWalletLevel: {
      onChainTxFee: OnChainTxFeeQuery,
      onChainUsdTxFee: OnChainUsdTxFeeQuery,
      onChainUsdTxFeeAsBtcDenominated: OnChainUsdTxFeeAsBtcDenominatedQuery,
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
