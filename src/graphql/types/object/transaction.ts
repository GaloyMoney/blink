import dedent from "dedent"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { connectionDefinitions } from "@graphql/connections"
import { normalizeDisplayPrice } from "@graphql/root/mutation"

import { TxStatus as DomainTxStatus } from "@domain/wallets"
import { checkedToDisplayCurrency } from "@domain/fiat"

import InitiationVia from "../abstract/initiation-via"
import SettlementVia from "../abstract/settlement-via"

import Memo from "../scalar/memo"
import TxStatus from "../scalar/tx-status"
import Timestamp from "../scalar/timestamp"
import SignedAmount from "../scalar/signed-amount"
import WalletCurrency from "../scalar/wallet-currency"
import DisplayCurrency from "../scalar/display-currency"
import SignedDisplayMajorAmount from "../scalar/signed-display-amount"
import TxDirection, { txDirectionValues } from "../scalar/tx-direction"

import PriceOfOneSettlementMinorUnitInDisplayMinorUnit from "./price-of-one-settlement-minor-unit-in-display-minor-unit"

const Transaction = GT.Object<WalletTransaction>({
  name: "Transaction",
  description: dedent`Give details about an individual transaction.
  Galoy have a smart routing system which is automatically
  settling intraledger when both the payer and payee use the same wallet
  therefore it's possible the transactions is being initiated onchain
  or with lightning but settled intraledger.`,
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
      resolve: async (source, _, { loaders }) => {
        const { settlementVia } = source

        // Filter out source.id as OnChainTxHash
        if (
          settlementVia.type === "onchain" &&
          source.id === settlementVia.transactionHash &&
          // If not pending, we would like this to error in the next step with invalid source.id
          source.status === DomainTxStatus.Pending
        ) {
          return settlementVia
        }

        let result: LedgerTransactionMetadata | undefined | RepositoryError
        // Need try-catch because 'load' function throws any errors returned to it from loader function
        try {
          result = await loaders.txnMetadata.load(source.id)
        } catch (err) {
          result = err
        }
        if (result instanceof Error || result === undefined) return settlementVia

        const updatedSettlementVia = { ...settlementVia }
        for (const key of Object.keys(settlementVia)) {
          /* eslint @typescript-eslint/ban-ts-comment: "off" */
          // @ts-ignore-next-line no-implicit-any
          updatedSettlementVia[key] =
            // @ts-ignore-next-line no-implicit-any
            result[key] !== undefined ? result[key] : settlementVia[key]
        }

        return updatedSettlementVia
      },
    },
    settlementAmount: {
      type: GT.NonNull(SignedAmount),
      description: "Amount of the settlement currency sent or received.",
    },
    settlementFee: {
      type: GT.NonNull(SignedAmount),
    },
    settlementPrice: {
      type: GT.NonNull(PriceOfOneSettlementMinorUnitInDisplayMinorUnit),
      resolve: (source) => {
        const displayCurrency = checkedToDisplayCurrency(
          source.settlementDisplayPrice.displayCurrency,
        )
        if (displayCurrency instanceof Error) throw mapError(displayCurrency)

        const settlementDisplayPrice = normalizeDisplayPrice(
          source.settlementDisplayPrice,
        )

        const formattedAmount = `${
          Number(settlementDisplayPrice.base) /
          10 ** Number(settlementDisplayPrice.offset)
        }`

        return {
          ...settlementDisplayPrice,
          formattedAmount,
          currencyUnit: "MINOR",
        }
      },
      description: "Price in WALLETCURRENCY/SETTLEMENTUNIT at time of settlement.",
    },
    settlementCurrency: {
      type: GT.NonNull(WalletCurrency),
      description: "Wallet currency for transaction.",
    },
    settlementDisplayAmount: {
      type: GT.NonNull(SignedDisplayMajorAmount),
      resolve: (source) => `${source.settlementDisplayAmount}`,
    },
    settlementDisplayFee: {
      type: GT.NonNull(SignedDisplayMajorAmount),
      resolve: (source) => `${source.settlementDisplayFee}`,
    },
    settlementDisplayCurrency: {
      type: GT.NonNull(DisplayCurrency),
      resolve: (source) => source.settlementDisplayPrice.displayCurrency,
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

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default Transaction
