import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import { GT } from "@graphql/index"
import Price from "@graphql/types/object/price"
import IError from "@graphql/types/abstract/error"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import GraphQLUser from "@graphql/types/object/graphql-user"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import OnChainTxHash from "@graphql/types/scalar/onchain-tx-hash"
import TxNotificationType from "@graphql/types/scalar/tx-notification-type"
import InvoicePaymentStatus from "@graphql/types/scalar/invoice-payment-status"

import { Prices } from "@app"
import { PubSubService } from "@services/pubsub"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"
import { AuthenticationError, UnknownClientError } from "@graphql/error"
import { baseLogger } from "@services/logger"

const pubsub = PubSubService()

const IntraLedgerUpdate = GT.Object({
  name: "IntraLedgerUpdate",
  fields: () => ({
    txNotificationType: { type: GT.NonNull(TxNotificationType) },
    amount: { type: GT.NonNull(SatAmount) },
    displayCurrencyPerSat: { type: GT.NonNull(GT.Float) },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "updated over displayCurrencyPerSat",
    },
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const LnUpdate = GT.Object({
  name: "LnUpdate",
  fields: () => ({
    paymentHash: { type: GT.NonNull(PaymentHash) },
    status: { type: GT.NonNull(InvoicePaymentStatus) },
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainUpdate = GT.Object({
  name: "OnChainUpdate",
  fields: () => ({
    txNotificationType: { type: GT.NonNull(TxNotificationType) },
    txHash: { type: GT.NonNull(OnChainTxHash) },
    amount: { type: GT.NonNull(SatAmount) },
    displayCurrencyPerSat: { type: GT.NonNull(GT.Float) },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "updated over displayCurrencyPerSat",
    },
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const UserUpdate = GT.Union({
  name: "UserUpdate",
  types: [Price, LnUpdate, OnChainUpdate, IntraLedgerUpdate],
  resolveType: (obj) => obj.resolveType,
})

const MyUpdatesPayload = GT.Object({
  name: "MyUpdatesPayload",
  fields: () => ({
    errors: { type: GT.NonNullList(IError) },
    update: { type: UserUpdate },
    me: { type: GraphQLUser },
  }),
})

type MePayloadPrice = {
  satUsdCentPrice: number
}

type MeResolvePrice = {
  resolveType: "Price"
  base: number
  offset: number
  currencyUnit: string
  formattedAmount: string
}

type MeResolveLn = {
  [key: string]: unknown
}

type MeResolveOnChain = {
  [key: string]: unknown
}

type MeResolveIntraLedger = {
  [key: string]: unknown
}

type MeResolveSource = {
  errors: IError[]
  price?: MePayloadPrice
  invoice?: MeResolveLn
  transaction?: MeResolveOnChain
  intraLedger?: MeResolveIntraLedger
}

type MeResolveUpdate =
  | MeResolvePrice
  | MeResolveLn
  | MeResolveOnChain
  | MeResolveIntraLedger

const userPayload = (domainUser: User | null) => (updateData: MeResolveUpdate) => ({
  errors: [],
  me: domainUser,
  update: updateData,
})

const MeSubscription = {
  type: GT.NonNull(MyUpdatesPayload),
  resolve: (
    source: MeResolveSource | undefined,
    _args: unknown,
    ctx: GraphQLContextForUser,
  ) => {
    if (!ctx.domainUser) {
      throw new AuthenticationError({
        message: "Not Authenticated for subscription",
        logger: baseLogger,
      })
    }

    if (source === undefined) {
      throw new UnknownClientError({
        message:
          "Got 'undefined' payload. Check url used to ensure right websocket endpoint was used for subscription.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    if (source.errors) {
      return { errors: source.errors }
    }

    const myPayload = userPayload(ctx.domainUser)

    if (source.price) {
      return userPayload(null)({
        resolveType: "Price",
        base: Math.round(source.price.satUsdCentPrice * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: "USDCENT",
        formattedAmount: source.price.satUsdCentPrice.toString(),
      })
    }

    if (source.invoice) {
      return myPayload({ resolveType: "LnUpdate", ...source.invoice })
    }

    if (source.transaction) {
      return myPayload({
        resolveType: "OnChainUpdate",
        usdPerSat: source.transaction.displayCurrencyPerSat,
        ...source.transaction,
      })
    }

    if (source.intraLedger) {
      return myPayload({
        resolveType: "IntraLedgerUpdate",
        usdPerSat: source.intraLedger.displayCurrencyPerSat,
        ...source.intraLedger,
      })
    }
  },

  subscribe: async (_source: unknown, _args: unknown, ctx: GraphQLContextForUser) => {
    if (!ctx.domainUser) {
      throw new AuthenticationError({
        message: "Not Authenticated for subscription",
        logger: baseLogger,
      })
    }
    const accountUpdatedTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.AccountUpdate,
      suffix: ctx.domainAccount.id,
    })

    const satUsdPrice = await Prices.getCurrentPrice()
    if (!(satUsdPrice instanceof Error)) {
      pubsub.publishImmediate({
        trigger: accountUpdatedTrigger,
        payload: { price: { satUsdCentPrice: 100 * satUsdPrice } },
      })
    }

    return pubsub.createAsyncIterator({
      trigger: [accountUpdatedTrigger, PubSubDefaultTriggers.UserPriceUpdate],
    })
  },
}

export default MeSubscription
