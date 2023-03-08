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

  const testMetadata = async <S extends WalletCurrency>({
    senderWalletDescriptor,
    metadata,
    isSend,
    isIntraLedger = false,
    senderDisplayAmounts,
  }: {
    senderWalletDescriptor: WalletDescriptor<S>
    metadata
    isSend: boolean
    isIntraLedger?: boolean
    senderDisplayAmounts?: {
      amountDisplayCurrency: DisplayCurrencyBaseAmount
      feeDisplayCurrency: DisplayCurrencyBaseAmount
      displayCurrency: DisplayCurrency
    }
  }) => {
    const testCases = [
      { walletDescriptor: senderWalletDescriptor, displayAmounts: senderDisplayAmounts },
    ]

    for (const { walletDescriptor, displayAmounts: displayAmountsRaw } of testCases) {
      const txns = await LedgerService().getTransactionsByWalletId(walletDescriptor.id)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      const satsAmount = toSats(isSend ? sendAmount.btc.amount : receiveAmount.btc.amount)
      const centsAmount = toCents(
        isSend ? sendAmount.usd.amount : receiveAmount.usd.amount,
      )

      const satsFee = !isIntraLedger ? toSats(bankFee.btc.amount) : 0
      const centsFee = !isIntraLedger ? toSats(bankFee.usd.amount) : 0

      const debit = isSend
        ? walletDescriptor.currency === WalletCurrency.Btc
          ? satsAmount
          : centsAmount
        : 0

      const credit = !isSend
        ? walletDescriptor.currency === WalletCurrency.Btc
          ? satsAmount
          : centsAmount
        : 0

      const usdDisplayAmounts = {
        displayAmount: centsAmount,
        displayFee: centsFee,
        displayCurrency: DisplayCurrency.Usd,
      }

      const displayAmounts = displayAmountsRaw
        ? {
            displayAmount: displayAmountsRaw.amountDisplayCurrency,
            displayFee: displayAmountsRaw.feeDisplayCurrency,
            displayCurrency: displayAmountsRaw.displayCurrency,
          }
        : usdDisplayAmounts

      const expectedFields = {
        type: metadata,

        debit,
        credit,

        satsAmount,
        satsFee,
        centsAmount,
        centsFee,

        ...displayAmounts,
      }
      expect(txn).toEqual(expect.objectContaining(expectedFields))
    }
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
        const displayAmounts = displayReceiveEurAmounts
        it("receives to btc wallet", async () => {
          const btcWalletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)

          await recordFn({
            walletDescriptor: btcWalletDescriptor,
            paymentAmount: receiveAmount,
            bankFee,
            displayAmounts,
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
            senderDisplayAmounts: displayAmounts,
          })
        })

        it("receives to usd wallet", async () => {
          const usdWalletDescriptor = UsdWalletDescriptor(crypto.randomUUID() as WalletId)
          await recordFn({
            walletDescriptor: usdWalletDescriptor,
            paymentAmount: receiveAmount,
            bankFee,
            displayAmounts,
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
            senderDisplayAmounts: displayAmounts,
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
        const displayAmounts = displaySendEurAmounts
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
            displayAmounts,
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
            senderDisplayAmounts: displayAmounts,
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
            displayAmounts,
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

          await testMetadata({
            senderWalletDescriptor: usdWalletDescriptor,
            metadata,
            isSend: true,
            senderDisplayAmounts: displayAmounts,
          })
        })
      })
    })
  })

  describe("recordIntraledger", () => {
    const itRecordIntraLedger = ({
      recordFn,
      metadata,
      send,
      receive,
    }: {
      recordFn: RecordInternalTxTestFn
      metadata
      send: WalletCurrency
      receive: WalletCurrency
    }) => {
      it(`sends from ${send.toLowerCase()} wallet to ${receive.toLowerCase()} wallet`, async () => {
        const displaySendAmounts = displaySendEurAmounts
        const displayReceiveAmounts = displayReceiveEurAmounts

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

        const senderDisplayAmounts = {
          senderAmountDisplayCurrency: displaySendAmounts.amountDisplayCurrency,
          senderFeeDisplayCurrency: displaySendAmounts.feeDisplayCurrency,
          senderDisplayCurrency: displaySendAmounts.displayCurrency,
        }

        const recipientDisplayAmounts = {
          recipientAmountDisplayCurrency: displayReceiveAmounts.amountDisplayCurrency,
          recipientFeeDisplayCurrency: displayReceiveAmounts.feeDisplayCurrency,
          recipientDisplayCurrency: displayReceiveAmounts.displayCurrency,
        }

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
          senderDisplayAmounts,
          recipientDisplayAmounts,
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
          senderDisplayAmounts: displaySendAmounts,
        })
      })
    }

    const runRecordIntraLedger = ({
      recordFn,
      metadata,
    }: {
      recordFn: RecordInternalTxTestFn
      metadata
    }) => {
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

    const runRecordTradeIntraAccount = ({
      recordFn,
      metadata,
    }: {
      recordFn: RecordInternalTxTestFn
      metadata
    }) => {
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
