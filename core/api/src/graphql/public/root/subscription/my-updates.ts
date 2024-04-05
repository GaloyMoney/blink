import { Prices } from "@/app"

import {
  majorToMinorUnit,
  SAT_PRICE_PRECISION_OFFSET,
  USD_PRICE_PRECISION_OFFSET,
  UsdDisplayCurrency,
} from "@/domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"

import { GT } from "@/graphql/index"
import Price from "@/graphql/public/types/object/price"
import IError from "@/graphql/shared/types/abstract/error"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import GraphQLUser from "@/graphql/public/types/object/user"
import Transaction from "@/graphql/shared/types/object/transaction"
import PaymentHash from "@/graphql/shared/types/scalar/payment-hash"
import RealtimePrice from "@/graphql/public/types/object/realtime-price"
import OnChainTxHash from "@/graphql/shared/types/scalar/onchain-tx-hash"
import { AuthenticationError, UnknownClientError } from "@/graphql/error"
import TxNotificationType from "@/graphql/public/types/scalar/tx-notification-type"
import InvoicePaymentStatus from "@/graphql/shared/types/scalar/invoice-payment-status"
import { baseLogger } from "@/services/logger"
import { PubSubService } from "@/services/pubsub"

const pubsub = PubSubService()

const IntraLedgerUpdate = GT.Object({
  name: "IntraLedgerUpdate",
  fields: () => ({
    txNotificationType: { type: GT.NonNull(TxNotificationType) },
    amount: {
      type: GT.NonNull(SatAmount),
      deprecationReason: "Deprecated in favor of transaction",
    },
    displayCurrencyPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "Deprecated in favor of transaction",
    },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "updated over displayCurrencyPerSat",
    },
    walletId: {
      type: GT.NonNull(WalletId),
      deprecationReason: "Deprecated in favor of transaction",
    },
    transaction: { type: GT.NonNull(Transaction) },
  }),
})

const LnUpdate = GT.Object({
  name: "LnUpdate",
  fields: () => ({
    paymentHash: {
      type: GT.NonNull(PaymentHash),
      deprecationReason: "Deprecated in favor of transaction",
    },
    status: { type: GT.NonNull(InvoicePaymentStatus) },
    walletId: {
      type: GT.NonNull(WalletId),
      deprecationReason: "Deprecated in favor of transaction",
    },
    transaction: { type: GT.NonNull(Transaction) },
  }),
})

const OnChainUpdate = GT.Object({
  name: "OnChainUpdate",
  fields: () => ({
    txNotificationType: { type: GT.NonNull(TxNotificationType) },
    txHash: {
      type: GT.NonNull(OnChainTxHash),
      deprecationReason: "Deprecated in favor of transaction",
    },
    amount: {
      type: GT.NonNull(SatAmount),
      deprecationReason: "Deprecated in favor of transaction",
    },
    displayCurrencyPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "Deprecated in favor of transaction",
    },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
      deprecationReason: "updated over displayCurrencyPerSat",
    },
    walletId: {
      type: GT.NonNull(WalletId),
      deprecationReason: "Deprecated in favor of transaction",
    },
    transaction: { type: GT.NonNull(Transaction) },
  }),
})

const UserUpdate = GT.Union({
  name: "UserUpdate",
  types: [RealtimePrice, Price, LnUpdate, OnChainUpdate, IntraLedgerUpdate],
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
  timestamp: Date
  pricePerSat: number
  pricePerUsdCent: number
  currency: PriceCurrency
  displayCurrency: DisplayCurrency
}

type MeResolvePrice = {
  resolveType: "Price"
  base: number
  offset: number
  currencyUnit: string
  formattedAmount: string
}

type IPrice = {
  base: number
  offset: number
  currencyUnit: string
}

type MeResolveRealtimePrice = {
  resolveType: "RealtimePrice"
  id: string
  timestamp: Date
  denominatorCurrencyDetails: PriceCurrency
  denominatorCurrency: DisplayCurrency
  btcSatPrice: IPrice
  usdCentPrice: IPrice
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
  realtimePrice?: MePayloadPrice
  price?: MePayloadPrice
  invoice?: MeResolveLn
  transaction?: MeResolveOnChain
  intraLedger?: MeResolveIntraLedger
}

type MeResolveUpdate =
  | MeResolveRealtimePrice
  | MeResolvePrice
  | MeResolveLn
  | MeResolveOnChain
  | MeResolveIntraLedger

const userPayload = (domainAccount: Account | null) => (updateData: MeResolveUpdate) => ({
  errors: [],
  me: domainAccount,
  update: updateData,
})

const MeSubscription = {
  type: GT.NonNull(MyUpdatesPayload),
  resolve: (
    source: MeResolveSource | undefined,
    _args: unknown,
    ctx: GraphQLPublicContextAuth | GraphQLPublicContext,
  ) => {
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

    // non auth request

    // This will be deprecated but while we update the app must return only USD updates
    if (source.price) {
      if (source.price.displayCurrency !== UsdDisplayCurrency) {
        return {
          errors: [{ message: "Price is deprecated, please use realtimePrice event" }],
        }
      }

      const minorUnitPerSat = majorToMinorUnit({
        amount: source.price.pricePerSat,
        displayCurrency: source.price.displayCurrency,
      })

      return userPayload(null)({
        resolveType: "Price",
        base: Math.round(minorUnitPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: `${source.price.displayCurrency}CENT`,
        formattedAmount: minorUnitPerSat.toString(),
      })
    }

    if (!("domainAccount" in ctx) || !ctx.domainAccount) {
      throw new AuthenticationError({
        message: "Not Authenticated for subscription",
        logger: baseLogger,
      })
    }

    // authed request
    const myPayload = userPayload(ctx.domainAccount)
    if (source.realtimePrice) {
      const { timestamp, currency, pricePerSat, pricePerUsdCent } = source.realtimePrice
      const minorUnitPerSat = majorToMinorUnit({
        amount: pricePerSat,
        displayCurrency: currency.code,
      })
      const minorUnitPerUsdCent = majorToMinorUnit({
        amount: pricePerUsdCent,
        displayCurrency: currency.code,
      })
      return myPayload({
        resolveType: "RealtimePrice",
        timestamp: new Date(timestamp),
        denominatorCurrencyDetails: currency,
        denominatorCurrency: currency.code,
        btcSatPrice: {
          base: Math.round(minorUnitPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
          offset: SAT_PRICE_PRECISION_OFFSET,
          currencyUnit: "MINOR",
        },
        usdCentPrice: {
          base: Math.round(minorUnitPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
          offset: USD_PRICE_PRECISION_OFFSET,
          currencyUnit: "MINOR",
        },
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

  subscribe: async (_source: unknown, _args: unknown, ctx: GraphQLPublicContextAuth) => {
    if (!ctx.domainAccount) {
      throw new AuthenticationError({
        message: "Not Authenticated for subscription",
        logger: baseLogger,
      })
    }
    const { id, displayCurrency } = ctx.domainAccount
    const accountUpdatedTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.AccountUpdate,
      suffix: id,
    })

    const currency = await Prices.getCurrency({ currency: displayCurrency })
    const pricePerSat = await Prices.getCurrentSatPrice({ currency: displayCurrency })
    const pricePerUsdCent = await Prices.getCurrentUsdCentPrice({
      currency: displayCurrency,
    })
    if (
      !(currency instanceof Error) &&
      !(pricePerSat instanceof Error) &&
      !(pricePerUsdCent instanceof Error)
    ) {
      const priceData = {
        timestamp: pricePerSat.timestamp,
        currency,
        displayCurrency,
        pricePerSat: pricePerSat.price,
        pricePerUsdCent: pricePerUsdCent.price,
      }
      if (displayCurrency === UsdDisplayCurrency) {
        pubsub.publishDelayed({
          trigger: accountUpdatedTrigger,
          payload: { price: priceData },
        })
      }
      pubsub.publishDelayed({
        trigger: accountUpdatedTrigger,
        payload: { realtimePrice: priceData },
      })
    }

    const userPriceUpdateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.UserPriceUpdate,
      suffix: displayCurrency,
    })

    return pubsub.createAsyncIterator({
      trigger: [accountUpdatedTrigger, userPriceUpdateTrigger],
    })
  },
}

export default MeSubscription
