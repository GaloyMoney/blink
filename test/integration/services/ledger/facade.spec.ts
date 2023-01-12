import crypto from "crypto"

import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@domain/shared"
import * as LedgerFacade from "@services/ledger/facade"

import {
  recordLnIntraLedgerPayment,
  recordLnTradeIntraAccountTxn,
  recordOnChainIntraLedgerPayment,
  recordOnChainTradeIntraAccountTxn,
  recordReceiveLnPayment,
  recordReceiveOnChainPayment,
  recordSendLnPayment,
  recordSendOnChainPayment,
  recordWalletIdIntraLedgerPayment,
  recordWalletIdTradeIntraAccountTxn,
} from "./helpers"

describe("Facade", () => {
  const receiveAmount = {
    usd: { amount: 100n, currency: WalletCurrency.Usd },
    btc: { amount: 200n, currency: WalletCurrency.Btc },
  }
  const sendAmount = {
    usd: { amount: 20n, currency: WalletCurrency.Usd },
    btc: { amount: 40n, currency: WalletCurrency.Btc },
  }
  const bankFee = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 20n, currency: WalletCurrency.Btc },
  }

  describe("recordReceive", () => {
    const runRecordReceive = (recordFn) => {
      it("receives to btc wallet", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
        await recordFn({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
        })

        const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          btcWalletDescriptor,
        )
        if (balance instanceof Error) throw balance
        expect(balance).toEqual(
          expect.objectContaining({
            amount: receiveAmount.btc.amount,
            currency: WalletCurrency.Btc,
          }),
        )
      })

      it("receives to usd wallet", async () => {
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)
        await recordFn({
          walletDescriptor: usdWalletDescriptor,
          paymentAmount: receiveAmount,
          bankFee,
        })

        const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          usdWalletDescriptor,
        )
        if (balance instanceof Error) throw balance
        expect(balance).toEqual(
          expect.objectContaining({
            amount: receiveAmount.usd.amount,
            currency: WalletCurrency.Usd,
          }),
        )
      })
    }

    describe("recordReceiveLnPayment", () => runRecordReceive(recordReceiveLnPayment))

    describe("recordReceiveOnChainPayment", () =>
      runRecordReceive(recordReceiveOnChainPayment))
  })

  describe("recordSend", () => {
    const runRecordSend = (recordFn) => {
      it("sends from btc wallet", async () => {
        const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

        const startingBalance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          btcWalletDescriptor,
        )
        if (startingBalance instanceof Error) throw startingBalance

        await recordFn({
          walletDescriptor: btcWalletDescriptor,
          paymentAmount: sendAmount,
          bankFee,
        })

        const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          btcWalletDescriptor,
        )
        if (balance instanceof Error) throw balance
        expect(balance).toEqual(
          expect.objectContaining({
            amount: startingBalance.amount - sendAmount.btc.amount,
            currency: WalletCurrency.Btc,
          }),
        )
      })

      it("sends from usd wallet", async () => {
        const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

        const startingBalance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          usdWalletDescriptor,
        )
        if (startingBalance instanceof Error) throw startingBalance

        await recordFn({
          walletDescriptor: usdWalletDescriptor,
          paymentAmount: sendAmount,
          bankFee,
        })

        const balance = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          usdWalletDescriptor,
        )
        if (balance instanceof Error) throw balance
        expect(balance).toEqual(
          expect.objectContaining({
            amount: startingBalance.amount - sendAmount.usd.amount,
            currency: WalletCurrency.Usd,
          }),
        )
      })
    }
    describe("recordSendLnPayment", () => runRecordSend(recordSendLnPayment))

    describe("recordSendOnChainPayment", () => runRecordSend(recordSendOnChainPayment))
  })

  describe("recordIntraledger", () => {
    const itRecordIntraLedger = ({ recordFn, send, receive }) => {
      it(`sends from ${send.toLowerCase()} wallet to ${receive.toLowerCase()} wallet`, async () => {
        const btcSendWalletDescriptor = BtcWalletDescriptor(
          crypto.randomUUID() as WalletId,
        )
        const btcReceiveWalletDescriptor = BtcWalletDescriptor(
          crypto.randomUUID() as WalletId,
        )

        const usdSendWalletDescriptor = UsdWalletDescriptor(
          crypto.randomUUID() as WalletId,
        )
        const usdReceiveWalletDescriptor = UsdWalletDescriptor(
          crypto.randomUUID() as WalletId,
        )

        const senderWalletDescriptor =
          send === WalletCurrency.Btc ? btcSendWalletDescriptor : usdSendWalletDescriptor

        const recipientWalletDescriptor =
          receive === WalletCurrency.Btc
            ? btcReceiveWalletDescriptor
            : usdReceiveWalletDescriptor

        const startingBalanceSender =
          await LedgerFacade.getLedgerAccountBalanceForWalletId(senderWalletDescriptor)
        if (startingBalanceSender instanceof Error) throw startingBalanceSender

        await recordFn({
          senderWalletDescriptor,
          recipientWalletDescriptor,
          paymentAmount: sendAmount,
        })

        const finishBalanceSender = await LedgerFacade.getLedgerAccountBalanceForWalletId(
          senderWalletDescriptor,
        )
        if (finishBalanceSender instanceof Error) throw finishBalanceSender
        expect(finishBalanceSender).toEqual(
          expect.objectContaining({
            amount:
              startingBalanceSender.amount -
              (send === WalletCurrency.Btc
                ? sendAmount.btc.amount
                : sendAmount.usd.amount),
            currency: send,
          }),
        )

        const finishBalanceReceiver =
          await LedgerFacade.getLedgerAccountBalanceForWalletId(recipientWalletDescriptor)
        if (finishBalanceReceiver instanceof Error) throw finishBalanceReceiver
        expect(finishBalanceReceiver).toEqual(
          expect.objectContaining({
            amount:
              receive === WalletCurrency.Btc
                ? sendAmount.btc.amount
                : sendAmount.usd.amount,
            currency: receive,
          }),
        )
      })
    }

    const runRecordIntraLedger = (recordFn) => {
      const sendReceivePairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Usd },
      ]

      for (const sendReceivePair of sendReceivePairs) {
        itRecordIntraLedger({
          recordFn,
          ...sendReceivePair,
        })
      }
    }

    const runRecordTradeIntraAccount = (recordFn) => {
      const sendReceivePairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
      ]

      for (const sendReceivePair of sendReceivePairs) {
        itRecordIntraLedger({
          recordFn,
          ...sendReceivePair,
        })
      }
    }

    describe("recordLnIntraLedgerPayment", () =>
      runRecordIntraLedger(recordLnIntraLedgerPayment))

    describe("recordWalletIdIntraLedgerPayment", () =>
      runRecordIntraLedger(recordWalletIdIntraLedgerPayment))

    describe("recordOnChainIntraLedgerPayment", () =>
      runRecordIntraLedger(recordOnChainIntraLedgerPayment))

    describe("recordLnTradeIntraAccountTxn", () =>
      runRecordTradeIntraAccount(recordLnTradeIntraAccountTxn))

    describe("recordWalletIdTradeIntraAccountTxn", () =>
      runRecordTradeIntraAccount(recordWalletIdTradeIntraAccountTxn))

    describe("recordOnChainTradeIntraAccountTxn", () =>
      runRecordTradeIntraAccount(recordOnChainTradeIntraAccountTxn))
  })
})
