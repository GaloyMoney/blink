import { GraphQLResolveInfo } from "graphql"

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

import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ACCOUNT_USERNAME,
} from "@services/tracing"

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

const addTracing = (trcFields: typeof fields) => {
  let key: keyof typeof trcFields
  for (key in trcFields) {
    const original = trcFields[key].resolve
    if (original) {
      trcFields[key].resolve = (
        source: unknown,
        args: unknown,
        context: GraphQLContext | GraphQLContextAuth,
        info: GraphQLResolveInfo,
      ) => {
        const { ip, domainAccount, kratosUser } = context
        return addAttributesToCurrentSpanAndPropagate(
          {
            [SemanticAttributes.ENDUSER_ID]: kratosUser?.id,
            [ACCOUNT_USERNAME]: domainAccount?.username,
            [SemanticAttributes.HTTP_CLIENT_IP]: ip,
          },
          () => original(source, args, context, info),
        )
      }
    }
  }
  return trcFields
}

const QueryType = GT.Object({
  name: "Query",
  fields: () => addTracing(fields),
})

export default QueryType
