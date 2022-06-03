import dedent from "dedent"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/shared"

import { GT } from "@graphql/index"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import Memo from "../scalar/memo"

import SatAmount from "../scalar/sat-amount"
import InitiationVia from "../abstract/initiation-via"
import SettlementVia from "../abstract/settlement-via"
import Timestamp from "../scalar/timestamp"
import TxDirection, { txDirectionValues } from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"
import WalletCurrency from "../scalar/wallet-currency"
import ITransaction from "../abstract/transaction"

import Price from "./price"

const BtcTransaction = GT.Object<WalletTransaction>({
  name: "BtcTransaction",
  description: dedent`Give details about an individual transaction.
  Galoy have a smart routing system which is automatically
  settling intraledger when both the payer and payee use the same wallet
  therefore it's possible the transactions is being initiated onchain
  or with lightning but settled intraledger.`,
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementCurrency === WalletCurrencyDomain.Btc,
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    initiationVia: {
      type: GT.NonNull(InitiationVia),
      description: "From which protocol the payment has been initiated.",
    },
    settlementVia: {
      type: GT.NonNull(SettlementVia),
      description: "To which protocol the payment has settled on.",
    },
    settlementAmount: {
      type: GT.NonNull(SatAmount),
      description: "Amount of sats sent or received.",
    },
    settlementFee: {
      type: GT.NonNull(SatAmount),
    },
    settlementPrice: {
      type: GT.NonNull(Price),
      resolve: (source) => {
        const settlementDisplayCurrencyPerSatInCents =
          source.settlementDisplayCurrencyPerSat * 100
        return {
          formattedAmount: settlementDisplayCurrencyPerSatInCents.toString(),
          base: Math.round(
            settlementDisplayCurrencyPerSatInCents * 10 ** SAT_PRICE_PRECISION_OFFSET,
          ),
          offset: SAT_PRICE_PRECISION_OFFSET,
          currencyUnit: "USDCENT",
        }
      },
      description: "Price in USDCENT/SAT at time of settlement.",
    },
    settlementCurrency: {
      type: GT.NonNull(WalletCurrency),
      description: "Wallet currency for transaction.",
    },
    direction: {
      type: GT.NonNull(TxDirection),
      resolve: (source) =>
        source.settlementAmount > 0 ? txDirectionValues.RECEIVE : txDirectionValues.SEND,
    },
    status: {
      type: GT.NonNull(TxStatus),
    },
    memo: {
      type: Memo,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default BtcTransaction
