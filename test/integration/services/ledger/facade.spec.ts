import crypto from "crypto"

import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"

import { LedgerService } from "@services/ledger"
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

  const testMetadata = async ({
    senderWalletDescriptor,
    metadata,
    isSend,
    isIntraLedger = false,
  }) => {
    const txns = await LedgerService().getTransactionsByWalletId(
      senderWalletDescriptor.id,
    )
    if (txns instanceof Error) throw txns
    if (!(txns && txns.length)) throw new Error()
    const txn = txns[0]

    const satsAmount = toSats(isSend ? sendAmount.btc.amount : receiveAmount.btc.amount)
    const centsAmount = toCents(isSend ? sendAmount.usd.amount : receiveAmount.usd.amount)

    const satsFee = !isIntraLedger ? toSats(bankFee.btc.amount) : 0
    const centsFee = !isIntraLedger ? toSats(bankFee.usd.amount) : 0

    const debit = isSend
      ? senderWalletDescriptor.currency === WalletCurrency.Btc
        ? satsAmount
        : centsAmount
      : 0

    const credit = !isSend
      ? senderWalletDescriptor.currency === WalletCurrency.Btc
        ? satsAmount
        : centsAmount
      : 0

    const expectedFields = {
      type: metadata,

      debit,
      credit,

      satsAmount,
      centsAmount,
      displayAmount: centsAmount,

      satsFee,
      centsFee,
      displayFee: centsFee,

      displayCurrency: DisplayCurrency.Usd,
    }
    expect(txn).toEqual(expect.objectContaining(expectedFields))
  }

  describe("recordReceive", () => {
    const recordReceiveToTest = [
      {
        name: "recordReceiveLnPayment",
        recordFn: recordReceiveLnPayment,
        metadata: LedgerTransactionType.Invoice,
      },
      {
        name: "recordReceiveOnChainPayment",
        recordFn: recordReceiveOnChainPayment,
        metadata: LedgerTransactionType.OnchainReceipt,
      },
    ]

    recordReceiveToTest.forEach(({ name, recordFn, metadata }) => {
      describe(`${name}`, () => {
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

          await testMetadata({
            senderWalletDescriptor: btcWalletDescriptor,
            metadata,
            isSend: false,
          })
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

          await testMetadata({
            senderWalletDescriptor: usdWalletDescriptor,
            metadata,
            isSend: false,
          })
        })
      })
    })
  })

  describe("recordSend", () => {
    const recordSendToTest = [
      {
        name: "recordSendLnPayment",
        recordFn: recordSendLnPayment,
        metadata: LedgerTransactionType.Payment,
      },
      {
        name: "recordSendOnChainPayment",
        recordFn: recordSendOnChainPayment,
        metadata: LedgerTransactionType.OnchainPayment,
      },
    ]

    recordSendToTest.forEach(({ name, recordFn, metadata }) => {
      describe(`${name}`, () => {
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

          await testMetadata({
            senderWalletDescriptor: btcWalletDescriptor,
            metadata,
            isSend: true,
          })
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
      })
    })
  })

  describe("recordIntraledger", () => {
    const itRecordIntraLedger = ({ recordFn, metadata, send, receive }) => {
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

        await testMetadata({
          senderWalletDescriptor,
          metadata,
          isSend: true,
          isIntraLedger: true,
        })
      })
    }

    const runRecordIntraLedger = ({ recordFn, metadata }) => {
      const sendReceivePairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Usd },
      ]

      for (const sendReceivePair of sendReceivePairs) {
        itRecordIntraLedger({
          recordFn,
          metadata,
          ...sendReceivePair,
        })
      }
    }

    const runRecordTradeIntraAccount = ({ recordFn, metadata }) => {
      const sendReceivePairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
      ]

      for (const sendReceivePair of sendReceivePairs) {
        itRecordIntraLedger({
          recordFn,
          metadata,
          ...sendReceivePair,
        })
      }
    }

    describe("recordLnIntraLedgerPayment", () => {
      runRecordIntraLedger({
        recordFn: recordLnIntraLedgerPayment,
        metadata: LedgerTransactionType.LnIntraLedger,
      })
    })

    describe("recordWalletIdIntraLedgerPayment", () => {
      runRecordIntraLedger({
        recordFn: recordWalletIdIntraLedgerPayment,
        metadata: LedgerTransactionType.IntraLedger,
      })
    })

    describe("recordOnChainIntraLedgerPayment", () => {
      runRecordIntraLedger({
        recordFn: recordOnChainIntraLedgerPayment,
        metadata: LedgerTransactionType.OnchainIntraLedger,
      })
    })

    describe("recordLnTradeIntraAccountTxn", () => {
      runRecordTradeIntraAccount({
        recordFn: recordLnTradeIntraAccountTxn,
        metadata: LedgerTransactionType.LnTradeIntraAccount,
      })
    })

    describe("recordWalletIdTradeIntraAccountTxn", () => {
      runRecordTradeIntraAccount({
        recordFn: recordWalletIdTradeIntraAccountTxn,
        metadata: LedgerTransactionType.WalletIdTradeIntraAccount,
      })
    })

    describe("recordOnChainTradeIntraAccountTxn", () => {
      runRecordTradeIntraAccount({
        recordFn: recordOnChainTradeIntraAccountTxn,
        metadata: LedgerTransactionType.OnChainTradeIntraAccount,
      })
    })
  })
})
