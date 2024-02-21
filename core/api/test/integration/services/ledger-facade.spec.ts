import crypto from "crypto"

import { MS_PER_DAY, ONE_DAY } from "@/config"

import { updateLnPaymentState } from "@/app/payments/update-ln-payment-state"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
} from "@/domain/shared"
import { UsdDisplayCurrency } from "@/domain/fiat"
import { LedgerTransactionType } from "@/domain/ledger"
import { LnPaymentState } from "@/domain/ledger/ln-payment-state"
import { CouldNotFindError } from "@/domain/errors"

import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { Transaction, TransactionMetadata } from "@/services/ledger/schema"
import { toObjectId } from "@/services/mongoose/utils"

import { createMandatoryUsers } from "test/helpers"
import {
  recordLnFailedPayment,
  recordLnFeeReimbursement,
  recordLnIntraLedgerPayment,
  recordLnTradeIntraAccountTxn,
  recordOnChainIntraLedgerPayment,
  recordOnChainTradeIntraAccountTxn,
  recordReceiveLnPayment,
  recordReceiveOnChainFeeReconciliation,
  recordReceiveOnChainPayment,
  recordSendLnPayment,
  recordSendOnChainPayment,
  recordWalletIdIntraLedgerPayment,
  recordWalletIdTradeIntraAccountTxn,
} from "test/helpers/ledger"
import { timestampDaysAgo } from "@/utils"

let accountWalletDescriptors: AccountWalletDescriptors

const calc = AmountCalculator()

const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

beforeAll(async () => {
  await createMandatoryUsers()

  accountWalletDescriptors = {
    BTC: BtcWalletDescriptor(crypto.randomUUID() as WalletId),
    USD: UsdWalletDescriptor(crypto.randomUUID() as WalletId),
  }
})

afterEach(async () => {
  await Transaction.deleteMany({})
  await TransactionMetadata.deleteMany({})
})

describe("Facade", () => {
  const receiveAmount = {
    usd: { amount: 100n, currency: WalletCurrency.Usd },
    btc: { amount: 300n, currency: WalletCurrency.Btc },
  }

  const sendAmount = {
    usd: { amount: 20n, currency: WalletCurrency.Usd },
    btc: { amount: 60n, currency: WalletCurrency.Btc },
  }

  const bankFee = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 30n, currency: WalletCurrency.Btc },
  }

  const displayReceiveUsdAmounts = {
    amountDisplayCurrency: Number(receiveAmount.usd.amount) as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: UsdDisplayCurrency,
  }

  const displayReceiveEurAmounts = {
    amountDisplayCurrency: 120 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 12 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  const displaySendEurAmounts = {
    amountDisplayCurrency: 24 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 12 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  const senderDisplayAmounts = {
    senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
    senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
    senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
  }

  const recipientDisplayAmounts = {
    recipientAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
    recipientFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
    recipientDisplayCurrency: displaySendEurAmounts.displayCurrency,
  }

  describe("record", () => {
    describe("recordReceive", () => {
      it("recordReceiveLnPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordReceiveLnPayment({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
          displayAmounts: displayReceiveEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.Invoice)
      })

      it("recordReceiveOnChainPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordReceiveOnChainPayment({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
          displayAmounts: displayReceiveEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.OnchainReceipt)
      })

      it("recordLnFailedPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordLnFailedPayment({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
          displayAmounts: displayReceiveEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.Payment)
      })

      it("recordLnFeeReimbursement", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordLnFeeReimbursement({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
          displayAmounts: displayReceiveEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.LnFeeReimbursement)
      })
    })

    describe("recordSend", () => {
      it("recordSendLnPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordSendLnPayment({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.Payment)
      })

      it("recordSendOnChainPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordSendOnChainPayment({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (res instanceof Error) throw res

        const txns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (txns instanceof Error) throw txns
        if (!(txns && txns.length)) throw new Error()
        const txn = txns[0]

        expect(txn.type).toBe(LedgerTransactionType.OnchainPayment)
      })
    })

    describe("recordIntraledger", () => {
      it("recordLnIntraLedgerPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordLnIntraLedgerPayment({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.LnIntraLedger)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.LnIntraLedger)
      })

      it("recordWalletIdIntraLedgerPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordWalletIdIntraLedgerPayment({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.IntraLedger)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.IntraLedger)
      })

      it("recordOnChainIntraLedgerPayment", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordOnChainIntraLedgerPayment({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.OnchainIntraLedger)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.OnchainIntraLedger)
      })
    })

    describe("recordTradeIntraAccount", () => {
      it("recordLnTradeIntraAccountTxn", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordLnTradeIntraAccountTxn({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.LnTradeIntraAccount)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.LnTradeIntraAccount)
      })

      it("recordWalletIdTradeIntraAccountTxn", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordWalletIdTradeIntraAccountTxn({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.WalletIdTradeIntraAccount)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.WalletIdTradeIntraAccount)
      })

      it("recordOnChainTradeIntraAccountTxn", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const res = await recordOnChainTradeIntraAccountTxn({
          senderWalletDescriptor: btcWalletDescriptor,
          recipientWalletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          senderDisplayAmounts: {
            senderAmountDisplayCurrency: displaySendEurAmounts.amountDisplayCurrency,
            senderFeeDisplayCurrency: displaySendEurAmounts.feeDisplayCurrency,
            senderDisplayCurrency: displaySendEurAmounts.displayCurrency,
          },
          recipientDisplayAmounts: {
            recipientAmountDisplayCurrency:
              displayReceiveUsdAmounts.amountDisplayCurrency,
            recipientFeeDisplayCurrency: displayReceiveUsdAmounts.feeDisplayCurrency,
            recipientDisplayCurrency: displayReceiveUsdAmounts.displayCurrency,
          },
        })
        if (res instanceof Error) throw res

        const senderTxns = await LedgerService().getTransactionsByWalletId(
          btcWalletDescriptor.id,
        )
        if (senderTxns instanceof Error) throw senderTxns
        if (!(senderTxns && senderTxns.length)) throw new Error()
        const senderTxn = senderTxns[0]
        expect(senderTxn.type).toBe(LedgerTransactionType.OnChainTradeIntraAccount)

        const recipientTxns = await LedgerService().getTransactionsByWalletId(
          usdWalletDescriptor.id,
        )
        if (recipientTxns instanceof Error) throw recipientTxns
        if (!(recipientTxns && recipientTxns.length)) throw new Error()
        const recipientTxn = recipientTxns[0]
        expect(recipientTxn.type).toBe(LedgerTransactionType.OnChainTradeIntraAccount)
      })
    })

    describe("recordReceiveOnChainFeeReconciliation", () => {
      it("recordReceiveOnChainFeeReconciliation", async () => {
        const lowerFee = { amount: 1000n, currency: WalletCurrency.Btc }
        const higherFee = { amount: 2100n, currency: WalletCurrency.Btc }

        const res = await recordReceiveOnChainFeeReconciliation({
          estimatedFee: lowerFee,
          actualFee: higherFee,
        })
        if (res instanceof Error) throw res

        const { transactionIds } = res
        expect(transactionIds).toHaveLength(2)

        const ledger = LedgerService()

        const tx0 = await ledger.getTransactionById(transactionIds[0])
        const tx1 = await ledger.getTransactionById(transactionIds[1])
        const liabilitiesTxn = [tx0, tx1].find(
          (tx): tx is LedgerTransaction<WalletCurrency> =>
            !(tx instanceof CouldNotFindError),
        )
        if (liabilitiesTxn === undefined) throw new Error("Could not find transaction")
        expect(liabilitiesTxn.type).toBe(LedgerTransactionType.OnchainPayment)
      })
    })
  })

  describe("TxVolumeAmountSinceFactory", () => {
    describe("txVolumeSince", () => {
      // Using 'net...' to be able to check incoming and outgoing volume
      const netTxVolumeAmountSince = LedgerFacade.netOutExternalPaymentVolumeAmountSince

      it("returns 0 volume for no transactions", async () => {
        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)
      })

      it("returns correct volume for a btc transactions", async () => {
        const resBtc = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resBtc instanceof Error) throw resBtc

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume).toStrictEqual(sendAmount.btc)
      })

      it("returns correct volume for a usd transactions", async () => {
        const resUsd = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.USD,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resUsd instanceof Error) throw resUsd

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.USD,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume).toStrictEqual(sendAmount.usd)
      })

      it("returns 0 volume for a non-external-payment btc transaction", async () => {
        const resBtc = await recordLnIntraLedgerPayment({
          senderWalletDescriptor: accountWalletDescriptors.BTC,
          recipientWalletDescriptor: accountWalletDescriptors.USD,
          paymentAmount: sendAmount,
          senderDisplayAmounts,
          recipientDisplayAmounts,
        })
        if (resBtc instanceof Error) throw resBtc

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)
      })

      it("returns 0 volume for a non-external-payment usd transaction", async () => {
        const resUsd = await recordLnIntraLedgerPayment({
          senderWalletDescriptor: accountWalletDescriptors.USD,
          recipientWalletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          senderDisplayAmounts,
          recipientDisplayAmounts,
        })
        if (resUsd instanceof Error) throw resUsd

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.USD,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)
      })

      it("returns 0 volume for a voided btc transaction", async () => {
        const resBtc = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resBtc instanceof Error) throw resBtc

        const voided = await LedgerFacade.recordLnSendRevert({
          journalId: resBtc.journalId,
          paymentHash: resBtc.paymentHash,
        })
        if (voided instanceof Error) return voided

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)
      })

      it("returns 0 volume for a delayed voided btc transaction", async () => {
        // Make initial transaction
        const resBtc = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resBtc instanceof Error) throw resBtc
        const { journalId, paymentHash } = resBtc

        let volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume).toStrictEqual(sendAmount.btc)

        // Void initial transaction
        const voided = await LedgerFacade.recordLnSendRevert({
          journalId,
          paymentHash,
        })
        if (voided instanceof Error) return voided

        volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)

        // Push initial transaction behind 1 day but keep void transaction current
        const newDateTime = new Date(Date.now() - MS_PER_DAY * 2)
        await Transaction.updateMany(
          { _journal: toObjectId(journalId) },
          { timestamp: newDateTime, datetime: newDateTime },
        )

        volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume.amount).toStrictEqual(0n)
      })

      it("returns correct volume for a fee reimbursed btc transaction", async () => {
        const resBtc = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resBtc instanceof Error) throw resBtc

        const reimbursed = await recordLnFeeReimbursement({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: bankFee,
          bankFee,
          displayAmounts: displayReceiveEurAmounts,
        })
        if (reimbursed instanceof Error) throw reimbursed

        const expectedVolume = calc.sub(sendAmount.btc, bankFee.btc)

        const volume = await netTxVolumeAmountSince({
          walletDescriptor: accountWalletDescriptors.BTC,
          timestamp: timestamp1DayAgo,
        })
        if (volume instanceof Error) throw volume
        expect(volume).toStrictEqual(expectedVolume)
      })
    })
  })

  describe("LnPaymentState", () => {
    const addFailedPayment = async (): Promise<PaymentHash> => {
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) throw settled

      const voided = await LedgerFacade.recordLnSendRevert({
        journalId: res.journalId,
        paymentHash: res.paymentHash,
      })
      if (voided instanceof Error) throw voided

      return res.paymentHash
    }

    it("return 'Pending' after initial send", async () => {
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
      })
      if (res instanceof Error) throw res

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.Pending)
    })

    it("return 'PendingAfterRetry' after initial send", async () => {
      const paymentHash = await addFailedPayment()

      // Retry
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
        paymentHash,
      })
      if (res instanceof Error) throw res

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.PendingAfterRetry)
    })

    it("return 'Success' after successful send", async () => {
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.Success)
    })

    it("return 'SuccessWithReimbursement' after success with reimburse", async () => {
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const reimbursed = await recordLnFeeReimbursement({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: receiveAmount,
        paymentHash: res.paymentHash,
        bankFee,
        displayAmounts: displayReceiveEurAmounts,
      })
      if (reimbursed instanceof Error) throw reimbursed

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.SuccessWithReimbursement)
    })

    it("return 'SuccessAfterRetry' after successful send", async () => {
      const paymentHash = await addFailedPayment()

      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
        paymentHash,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.SuccessAfterRetry)
    })

    it("return 'SuccessWithReimbursementAfterRetry' after success with reimburse", async () => {
      const paymentHash = await addFailedPayment()

      // Retry
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
        paymentHash,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const reimbursed = await recordLnFeeReimbursement({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: receiveAmount,
        paymentHash: res.paymentHash,
        bankFee,
        displayAmounts: displayReceiveEurAmounts,
      })
      if (reimbursed instanceof Error) throw reimbursed

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.SuccessWithReimbursementAfterRetry)
    })

    it("return 'Failed' after revert", async () => {
      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const voided = await LedgerFacade.recordLnSendRevert({
        journalId: res.journalId,
        paymentHash: res.paymentHash,
      })
      if (voided instanceof Error) return voided

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.Failed)
    })

    it("return 'FailedAfterRetry' after revert", async () => {
      const paymentHash = await addFailedPayment()

      const res = await recordSendLnPayment({
        walletDescriptor: accountWalletDescriptors.BTC,
        paymentAmount: sendAmount,
        bankFee,
        displayAmounts: displaySendEurAmounts,
        paymentHash,
      })
      if (res instanceof Error) throw res

      const settled = await LedgerFacade.settlePendingLnSend(res.paymentHash)
      if (settled instanceof Error) return settled

      const voided = await LedgerFacade.recordLnSendRevert({
        journalId: res.journalId,
        paymentHash: res.paymentHash,
      })
      if (voided instanceof Error) return voided

      const updateState = await updateLnPaymentState({
        walletId: accountWalletDescriptors.BTC.id,
        paymentHash: res.paymentHash,
      })
      if (updateState instanceof Error) throw updateState

      const txns = await LedgerService().getTransactionsByHash(res.paymentHash)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      expect(txn.lnPaymentState).toBe(LnPaymentState.FailedAfterRetry)
    })
  })
})
