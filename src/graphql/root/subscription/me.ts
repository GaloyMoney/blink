import { GT } from "@graphql/index"

import { USER_PRICE_UPDATE_EVENT, walletUpdateEvent } from "@config/app"
import pubsub from "@services/pubsub"
import { getCurrentPrice } from "@app/prices"
import IError from "@graphql/types/abstract/error"
import Price from "@graphql/types/object/price"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import InvoicePaymentStatus from "@graphql/types/scalar/invoice-payment-status"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainTxHash from "@graphql/types/scalar/onchain-tx-hash"
import TxNotificationType from "@graphql/types/scalar/tx-notification-type"

const InvoiceStatus = new GT.Object({
  name: "InvoiceStatus",
  fields: () => ({
    paymentHash: {
      type: GT.NonNull(PaymentHash),
    },
    status: {
      type: GT.NonNull(InvoicePaymentStatus),
    },
    balance: {
      type: GT.NonNull(SatAmount),
    },
  }),
})

const TransactionStatus = new GT.Object({
  name: "TransactionStatus",
  fields: () => ({
    txNotificationType: {
      type: GT.NonNull(TxNotificationType),
    },
    txHash: {
      type: GT.NonNull(OnChainTxHash),
    },
    amount: {
      type: GT.NonNull(SatAmount),
    },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
    },
  }),
})

const IntraLedgerStatus = new GT.Object({
  name: "IntraLedgerStatus",
  fields: () => ({
    txNotificationType: {
      type: GT.NonNull(TxNotificationType),
    },
    amount: {
      type: GT.NonNull(SatAmount),
    },
    usdPerSat: {
      type: GT.NonNull(GT.Float),
    },
  }),
})

const MePayloadData = new GT.Union({
  name: "MePayloadData",
  types: [Price, InvoiceStatus, TransactionStatus, IntraLedgerStatus],
  resolveType: (obj) => obj.resolveType,
})

const MePayload = new GT.Object({
  name: "MePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    data: { type: MePayloadData },
  }),
})

const MeSubscription = {
  type: GT.NonNull(MePayload),
  resolve: (source, args, ctx) => {
    if (!ctx.uid) {
      throw new Error("Not Authenticated")
    }

    if (source.errors) {
      return { errors: source.errors }
    }

    if (source.price) {
      return {
        errors: [],
        data: {
          resolveType: "Price",
          formattedAmount: source.price.satUsdCentPrice.toString(),
          base: Math.round(source.price.satUsdCentPrice * 10 ** 12),
          offset: 12,
          currencyUnit: "USDCENT",
        },
      }
    }

    if (source.invoice) {
      return {
        errors: [],
        data: {
          resolveType: "InvoiceStatus",
          ...source.invoice,
        },
      }
    }

    if (source.transaction) {
      return {
        errors: [],
        data: {
          resolveType: "TransactionStatus",
          ...source.transaction,
        },
      }
    }

    if (source.intraLedger) {
      return {
        errors: [],
        data: {
          resolveType: "IntraLedgerStatus",
          ...source.intraLedger,
        },
      }
    }
  },

  subscribe: async (source, args, ctx) => {
    if (!ctx.uid) {
      throw new Error("Not Authenticated")
    }

    const satUsdPrice = await getCurrentPrice()
    if (!(satUsdPrice instanceof Error)) {
      pubsub.publishImmediate(USER_PRICE_UPDATE_EVENT, {
        price: { satUsdCentPrice: 100 * satUsdPrice },
      })
    }

    const walletUddateEventName = walletUpdateEvent(ctx.uid)

    return pubsub.asyncIterator([walletUddateEventName, USER_PRICE_UPDATE_EVENT])
  },
}

export default MeSubscription
