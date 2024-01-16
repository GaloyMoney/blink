import crypto from "crypto"

import { MS_PER_DAY, ONE_DAY, getAccountLimits } from "@/config"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
  paymentAmountFromNumber,
} from "@/domain/shared"
import { AccountLevel, AccountTxVolumeRemaining } from "@/domain/accounts"
import { UsdDisplayCurrency } from "@/domain/fiat"
import { LedgerTransactionType } from "@/domain/ledger"
import { WalletPriceRatio } from "@/domain/payments"
import { CouldNotFindError } from "@/domain/errors"

import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { Transaction, TransactionMetadata } from "@/services/ledger/schema"
import { toObjectId } from "@/services/mongoose/utils"

import { createMandatoryUsers } from "test/helpers"
import {
  recordColdStorageTxReceive,
  recordColdStorageTxSend,
  recordLnChannelOpenOrClosingFee,
  recordLnFailedPayment,
  recordLnFeeReimbursement,
  recordLnIntraLedgerPayment,
  recordLnRoutingRevenue,
  recordLnTradeIntraAccountTxn,
  recordLndEscrowCredit,
  recordLndEscrowDebit,
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
import { ModifiedSet, timestampDaysAgo } from "@/utils"

let accountWalletDescriptors: AccountWalletDescriptors
let accountLimitsLevelOne: IAccountLimits
let accountLimitAmountsLevelOne: {
  intraLedgerLimit: UsdPaymentAmount
  withdrawalLimit: UsdPaymentAmount
  tradeIntraAccountLimit: UsdPaymentAmount
}

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()

  accountWalletDescriptors = {
    BTC: BtcWalletDescriptor(crypto.randomUUID() as WalletId),
    USD: UsdWalletDescriptor(crypto.randomUUID() as WalletId),
  }

  accountLimitsLevelOne = getAccountLimits({ level: AccountLevel.One })

  const intraLedgerLimitAmount = paymentAmountFromNumber({
    amount: accountLimitsLevelOne.intraLedgerLimit,
    currency: WalletCurrency.Usd,
  })
  if (intraLedgerLimitAmount instanceof Error) throw intraLedgerLimitAmount

  const withdrawalLimitAmount = paymentAmountFromNumber({
    amount: accountLimitsLevelOne.withdrawalLimit,
    currency: WalletCurrency.Usd,
  })
  if (withdrawalLimitAmount instanceof Error) throw withdrawalLimitAmount

  const tradeIntraAccountLimitAmount = paymentAmountFromNumber({
    amount: accountLimitsLevelOne.tradeIntraAccountLimit,
    currency: WalletCurrency.Usd,
  })
  if (tradeIntraAccountLimitAmount instanceof Error) throw tradeIntraAccountLimitAmount

  accountLimitAmountsLevelOne = {
    intraLedgerLimit: intraLedgerLimitAmount,
    withdrawalLimit: withdrawalLimitAmount,
    tradeIntraAccountLimit: tradeIntraAccountLimitAmount,
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

  describe("remaining limits", () => {
    const remainingWithdrawalLimit = async ({
      priceRatio,
    }: {
      priceRatio: WalletPriceRatio
    }) => {
      const accountVolumeRemaining = AccountTxVolumeRemaining(accountLimitsLevelOne)

      const walletVolumes = await LedgerFacade.externalPaymentVolumeAmountForAccountSince(
        {
          accountWalletDescriptors,
          period: ONE_DAY,
        },
      )
      if (walletVolumes instanceof Error) throw walletVolumes

      const remainingAmount = await accountVolumeRemaining.withdrawal({
        priceRatio,
        walletVolumes,
      })
      if (remainingAmount instanceof Error) throw remainingAmount

      return remainingAmount
    }

    describe("withdrawal", () => {
      const sendPriceRatio = WalletPriceRatio(sendAmount)
      if (sendPriceRatio instanceof Error) throw sendPriceRatio

      it("returns 0 volume for no transactions", async () => {
        const remaining = await remainingWithdrawalLimit({ priceRatio: sendPriceRatio })
        expect(remaining).toStrictEqual(accountLimitAmountsLevelOne.withdrawalLimit)
      })

      it("returns correct volume for a btc and usd transactions", async () => {
        const resBtc = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.BTC,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resBtc instanceof Error) throw resBtc

        const resUsd = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.USD,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resUsd instanceof Error) throw resUsd

        const expectedRemaining = calc.sub(
          accountLimitAmountsLevelOne.withdrawalLimit,
          calc.mul(sendAmount.usd, 2n),
        )

        const remaining = await remainingWithdrawalLimit({ priceRatio: sendPriceRatio })
        expect(remaining).toStrictEqual(expectedRemaining)
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

        const remaining = await remainingWithdrawalLimit({ priceRatio: sendPriceRatio })
        expect(remaining).toStrictEqual(accountLimitAmountsLevelOne.withdrawalLimit)
      })

      it("returns 0 volume for a delayed voided btc transaction", async () => {
        const resUsd = await recordSendLnPayment({
          walletDescriptor: accountWalletDescriptors.USD,
          paymentAmount: sendAmount,
          bankFee,
          displayAmounts: displaySendEurAmounts,
        })
        if (resUsd instanceof Error) throw resUsd
        const { journalId, paymentHash } = resUsd

        const voided = await LedgerFacade.recordLnSendRevert({
          journalId,
          paymentHash,
        })
        if (voided instanceof Error) return voided

        const newDateTime = new Date(Date.now() - MS_PER_DAY * 2)
        await Transaction.updateMany(
          { _journal: toObjectId(journalId) },
          { timestamp: newDateTime, datetime: newDateTime },
        )

        const remaining = await remainingWithdrawalLimit({ priceRatio: sendPriceRatio })
        expect(remaining).toStrictEqual(accountLimitAmountsLevelOne.withdrawalLimit)
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

        const expectedRemaining = calc.sub(
          accountLimitAmountsLevelOne.withdrawalLimit,
          calc.sub(sendAmount.usd, bankFee.usd),
        )

        const remaining = await remainingWithdrawalLimit({ priceRatio: sendPriceRatio })
        expect(remaining).toStrictEqual(expectedRemaining)
      })
    })
  })

  describe("volume by tx type", () => {
    // Define 'ExtendedLedgerTransactionType' and 'UserLedgerTransactionType'
    const FullLedgerTransactionType = {
      ...LedgerTransactionType,

      LnFailedPayment: LedgerTransactionType.Payment,

      IntraLedgerSend: LedgerTransactionType.IntraLedger,
      IntraLedgerReceive: LedgerTransactionType.IntraLedger,
      LnIntraLedgerSend: LedgerTransactionType.LnIntraLedger,
      LnIntraLedgerReceive: LedgerTransactionType.LnIntraLedger,
      OnchainIntraLedgerSend: LedgerTransactionType.OnchainIntraLedger,
      OnchainIntraLedgerReceive: LedgerTransactionType.OnchainIntraLedger,

      WalletIdTradeIntraAccountOut: LedgerTransactionType.WalletIdTradeIntraAccount,
      WalletIdTradeIntraAccountIn: LedgerTransactionType.WalletIdTradeIntraAccount,
      LnTradeIntraAccountOut: LedgerTransactionType.LnTradeIntraAccount,
      LnTradeIntraAccountIn: LedgerTransactionType.LnTradeIntraAccount,
      OnChainTradeIntraAccountOut: LedgerTransactionType.OnChainTradeIntraAccount,
      OnChainTradeIntraAccountIn: LedgerTransactionType.OnChainTradeIntraAccount,

      EscrowCredit: LedgerTransactionType.Escrow,
      EscrowDebit: LedgerTransactionType.Escrow,
    } as const

    const {
      IntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
      LnIntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
      OnchainIntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
      WalletIdTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
      LnTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
      OnChainTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
      Escrow, // eslint-disable-line @typescript-eslint/no-unused-vars

      ...ExtendedLedgerTransactionType
    } = FullLedgerTransactionType

    const {
      Fee, // eslint-disable-line @typescript-eslint/no-unused-vars
      RoutingRevenue, // eslint-disable-line @typescript-eslint/no-unused-vars
      ToColdStorage, // eslint-disable-line @typescript-eslint/no-unused-vars
      ToHotWallet, // eslint-disable-line @typescript-eslint/no-unused-vars
      EscrowCredit, // eslint-disable-line @typescript-eslint/no-unused-vars
      EscrowDebit, // eslint-disable-line @typescript-eslint/no-unused-vars

      ...UserLedgerTransactionType
    } = ExtendedLedgerTransactionType

    const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
    const otherBtcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

    const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
    if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

    const txTypesForVolumes = (
      includedTypes: (keyof typeof ExtendedLedgerTransactionType)[],
    ) => {
      const excludedTypes = Object.keys(ExtendedLedgerTransactionType)
        .map((key) => key as keyof typeof ExtendedLedgerTransactionType)
        .filter(
          (key: keyof typeof ExtendedLedgerTransactionType) =>
            !includedTypes.includes(key),
        )

      const includedTypesSet = new ModifiedSet(includedTypes)
      const excludedTypesSet = new ModifiedSet(excludedTypes)
      if (includedTypesSet.intersect(excludedTypesSet).size !== 0) {
        throw new Error("Issue in separating tx types for volume tests")
      }

      return { includedTypes, excludedTypes }
    }

    const externalOutTxFnForType = {
      Payment: recordSendLnPayment,
      OnchainPayment: recordSendOnChainPayment,
    }

    const externalInTxFnForType = {
      Invoice: recordReceiveLnPayment,
      OnchainReceipt: recordReceiveOnChainPayment,
      LnFeeReimbursement: recordLnFeeReimbursement,
      LnFailedPayment: recordLnFailedPayment,
    }

    const externalBankTxFnForType = {
      Fee: recordLnChannelOpenOrClosingFee,
      EscrowCredit: recordLndEscrowCredit,
      EscrowDebit: recordLndEscrowDebit,
      RoutingRevenue: recordLnRoutingRevenue,
      ToHotWallet: recordColdStorageTxSend,
      ToColdStorage: recordColdStorageTxReceive,
    }

    const internalSendTxFnForType = {
      IntraLedgerSend: recordWalletIdIntraLedgerPayment,
      OnchainIntraLedgerSend: recordOnChainIntraLedgerPayment,
      LnIntraLedgerSend: recordLnIntraLedgerPayment,
      WalletIdTradeIntraAccountOut: recordWalletIdTradeIntraAccountTxn,
      LnTradeIntraAccountOut: recordLnTradeIntraAccountTxn,
      OnChainTradeIntraAccountOut: recordOnChainTradeIntraAccountTxn,
    }

    const internalReceiveTxFnForType = {
      IntraLedgerReceive: recordWalletIdIntraLedgerPayment,
      OnchainIntraLedgerReceive: recordOnChainIntraLedgerPayment,
      LnIntraLedgerReceive: recordLnIntraLedgerPayment,
      WalletIdTradeIntraAccountIn: recordWalletIdTradeIntraAccountTxn,
      LnTradeIntraAccountIn: recordLnTradeIntraAccountTxn,
      OnChainTradeIntraAccountIn: recordOnChainTradeIntraAccountTxn,
    }

    const reconciliationTxFnForType = {
      Reconciliation: recordReceiveOnChainFeeReconciliation,
    }

    describe("All payment tx types, net volume", () => {
      const allPaymentTxTypes: (keyof typeof UserLedgerTransactionType)[] = [
        "Payment",
        "OnchainPayment",
        "IntraLedgerSend",
        "OnchainIntraLedgerSend",
        "LnIntraLedgerSend",
        "LnFeeReimbursement",
        "LnFailedPayment",
      ]

      const currentVolumeAmount = async () => {
        // Uses 'allPaymentVolumeAmountSince'
        const vol = await LedgerFacade.allPaymentVolumeAmountSince({
          walletDescriptor: btcWalletDescriptor,
          timestamp: timestamp1DayAgo,
        })
        if (vol instanceof Error) throw vol

        // Uses difference between 'outgoing' & 'incoming'
        return calc.sub(vol.outgoingBaseAmount, vol.incomingBaseAmount)
      }

      const {
        includedTypes: volumeAffectingTypes,
        excludedTypes: nonVolumeAffectingTypes,
      } = txTypesForVolumes(allPaymentTxTypes)

      describe("external out transactions", () => {
        const externalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in externalOutTxFnForType,
        )
        if (externalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of externalVolumeAffectingTypes) {
              const recordTx =
                externalOutTxFnForType[txType as keyof typeof externalOutTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const externalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in externalOutTxFnForType,
        )
        if (externalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of externalNonVolumeAffectingTypes) {
              const recordTx =
                externalOutTxFnForType[txType as keyof typeof externalOutTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("external in transactions", () => {
        const externalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in externalInTxFnForType,
        )
        if (externalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of externalVolumeAffectingTypes) {
              const recordTx =
                externalInTxFnForType[txType as keyof typeof externalInTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.sub(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const externalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in externalInTxFnForType,
        )
        if (externalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of externalNonVolumeAffectingTypes) {
              const recordTx =
                externalInTxFnForType[txType as keyof typeof externalInTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("internal send transactions", () => {
        const internalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in internalSendTxFnForType,
        )
        if (internalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of internalVolumeAffectingTypes) {
              const recordTx =
                internalSendTxFnForType[txType as keyof typeof internalSendTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  senderWalletDescriptor: btcWalletDescriptor,
                  recipientWalletDescriptor: otherBtcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const internalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in internalSendTxFnForType,
        )
        if (internalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of internalNonVolumeAffectingTypes) {
              const recordTx =
                internalSendTxFnForType[txType as keyof typeof internalSendTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  senderWalletDescriptor: btcWalletDescriptor,
                  recipientWalletDescriptor: otherBtcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("internal receive transactions", () => {
        const internalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in internalReceiveTxFnForType,
        )
        if (internalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of internalVolumeAffectingTypes) {
              const recordTx =
                internalReceiveTxFnForType[
                  txType as keyof typeof internalReceiveTxFnForType
                ]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  senderWalletDescriptor: otherBtcWalletDescriptor,
                  recipientWalletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const internalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in internalReceiveTxFnForType,
        )
        if (internalNonVolumeAffectingTypes.length) {
          // FIXME: IntraLedgerReceive txns aren't properly accounted for in
          //        the 'allPaymentVolume' implementation
          describe.skip("does not affect volume", () => {
            for (const txType of internalNonVolumeAffectingTypes) {
              const recordTx =
                internalReceiveTxFnForType[
                  txType as keyof typeof internalReceiveTxFnForType
                ]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  senderWalletDescriptor: otherBtcWalletDescriptor,
                  recipientWalletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("bank transactions", () => {
        describe("does not affect volume", () => {
          for (const txType in externalBankTxFnForType) {
            const recordTx =
              externalBankTxFnForType[txType as keyof typeof externalBankTxFnForType]

            it(`for ${txType} transaction`, async () => {
              const expected = await currentVolumeAmount()

              const result = await recordTx({
                paymentAmount: sendAmount,
              })
              expect(result).not.toBeInstanceOf(Error)

              const actual = await currentVolumeAmount()
              expect(expected).toStrictEqual(actual)
            })
          }
        })
      })

      describe("reconciliation transactions", () => {
        describe("does not affect volume", () => {
          for (const txType in reconciliationTxFnForType) {
            const recordTx =
              reconciliationTxFnForType[txType as keyof typeof reconciliationTxFnForType]

            it(`for ${txType} transaction`, async () => {
              const expected = await currentVolumeAmount()

              const result = await recordTx({
                estimatedFee: bankFee.btc,
                actualFee: calc.mul(bankFee.btc, 2n),
              })
              expect(result).not.toBeInstanceOf(Error)

              const actual = await currentVolumeAmount()
              expect(expected).toStrictEqual(actual)
            })
          }
        })
      })
    })

    describe("External payment (withdrawal) tx types, volume out", () => {
      const externalPaymentTxTypes: (keyof typeof UserLedgerTransactionType)[] = [
        "Payment",
        "OnchainPayment",
        "LnFeeReimbursement",
        "LnFailedPayment",
      ]

      const currentVolumeAmount = async () => {
        // Uses 'externalPaymentVolumeAmountSince'
        const vol = await LedgerFacade.externalPaymentVolumeAmountSince({
          walletDescriptor: btcWalletDescriptor,
          timestamp: timestamp1DayAgo,
        })
        if (vol instanceof Error) throw vol

        // Uses difference between 'outgoing' & 'incoming'
        return calc.sub(vol.outgoingBaseAmount, vol.incomingBaseAmount)
      }

      const {
        includedTypes: volumeAffectingTypes,
        excludedTypes: nonVolumeAffectingTypes,
      } = txTypesForVolumes(externalPaymentTxTypes)

      describe("external out transactions", () => {
        const externalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in externalOutTxFnForType,
        )
        if (externalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of externalVolumeAffectingTypes) {
              const recordTx =
                externalOutTxFnForType[txType as keyof typeof externalOutTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const externalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in externalOutTxFnForType,
        )
        if (externalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of externalNonVolumeAffectingTypes) {
              const recordTx =
                externalOutTxFnForType[txType as keyof typeof externalOutTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("external in transactions", () => {
        const externalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in externalInTxFnForType,
        )
        if (externalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of externalVolumeAffectingTypes) {
              const recordTx =
                externalInTxFnForType[txType as keyof typeof externalInTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.sub(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const externalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in externalInTxFnForType,
        )
        if (externalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of externalNonVolumeAffectingTypes) {
              const recordTx =
                externalInTxFnForType[txType as keyof typeof externalInTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  walletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  bankFee,
                  displayAmounts: displayReceiveUsdAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("internal send transactions", () => {
        const internalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in internalSendTxFnForType,
        )
        if (internalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of internalVolumeAffectingTypes) {
              const recordTx =
                internalSendTxFnForType[txType as keyof typeof internalSendTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  senderWalletDescriptor: btcWalletDescriptor,
                  recipientWalletDescriptor: otherBtcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const internalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in internalSendTxFnForType,
        )
        if (internalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of internalNonVolumeAffectingTypes) {
              const recordTx =
                internalSendTxFnForType[txType as keyof typeof internalSendTxFnForType]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  senderWalletDescriptor: btcWalletDescriptor,
                  recipientWalletDescriptor: otherBtcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("internal receive transactions", () => {
        const internalVolumeAffectingTypes = volumeAffectingTypes.filter(
          (txType) => txType in internalReceiveTxFnForType,
        )
        if (internalVolumeAffectingTypes.length) {
          describe("affects volume", () => {
            for (const txType of internalVolumeAffectingTypes) {
              const recordTx =
                internalReceiveTxFnForType[
                  txType as keyof typeof internalReceiveTxFnForType
                ]

              it(`for ${txType} transaction`, async () => {
                const expected = calc.add(await currentVolumeAmount(), sendAmount.btc)

                const result = await recordTx({
                  senderWalletDescriptor: otherBtcWalletDescriptor,
                  recipientWalletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }

        const internalNonVolumeAffectingTypes = nonVolumeAffectingTypes.filter(
          (txType) => txType in internalReceiveTxFnForType,
        )
        if (internalNonVolumeAffectingTypes.length) {
          describe("does not affect volume", () => {
            for (const txType of internalNonVolumeAffectingTypes) {
              const recordTx =
                internalReceiveTxFnForType[
                  txType as keyof typeof internalReceiveTxFnForType
                ]

              it(`for ${txType} transaction`, async () => {
                const expected = await currentVolumeAmount()

                const result = await recordTx({
                  senderWalletDescriptor: otherBtcWalletDescriptor,
                  recipientWalletDescriptor: btcWalletDescriptor,
                  paymentAmount: sendAmount,
                  senderDisplayAmounts,
                  recipientDisplayAmounts,
                })
                expect(result).not.toBeInstanceOf(Error)

                const actual = await currentVolumeAmount()
                expect(expected).toStrictEqual(actual)
              })
            }
          })
        }
      })

      describe("bank transactions", () => {
        describe("does not affect volume", () => {
          for (const txType in externalBankTxFnForType) {
            const recordTx =
              externalBankTxFnForType[txType as keyof typeof externalBankTxFnForType]

            it(`for ${txType} transaction`, async () => {
              const expected = await currentVolumeAmount()

              const result = await recordTx({
                paymentAmount: sendAmount,
              })
              expect(result).not.toBeInstanceOf(Error)

              const actual = await currentVolumeAmount()
              expect(expected).toStrictEqual(actual)
            })
          }
        })
      })

      describe("reconciliation transactions", () => {
        describe("does not affect volume", () => {
          for (const txType in reconciliationTxFnForType) {
            const recordTx =
              reconciliationTxFnForType[txType as keyof typeof reconciliationTxFnForType]

            it(`for ${txType} transaction`, async () => {
              const expected = await currentVolumeAmount()

              const result = await recordTx({
                estimatedFee: bankFee.btc,
                actualFee: calc.mul(bankFee.btc, 2n),
              })
              expect(result).not.toBeInstanceOf(Error)

              const actual = await currentVolumeAmount()
              expect(expected).toStrictEqual(actual)
            })
          }
        })
      })
    })
  })
})
