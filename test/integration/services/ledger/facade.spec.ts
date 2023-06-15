import crypto from "crypto"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
} from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"

import { LedgerService } from "@services/ledger"
import * as LedgerFacade from "@services/ledger/facade"
import { staticAccountIds } from "@services/ledger/facade/shared"
import { Transaction } from "@services/ledger/schema"
import { onChainLedgerAccountId } from "@services/ledger/domain"

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
} from "./helpers"

import { generateHash } from "test/helpers"

const calc = AmountCalculator()

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

  const displayReceiveUsdAmounts = {
    amountDisplayCurrency: Number(receiveAmount.usd.amount) as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: DisplayCurrency.Usd,
  }

  const displayReceiveEurAmounts = {
    amountDisplayCurrency: 120 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 12 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  const displaySendUsdAmounts = {
    amountDisplayCurrency: Number(sendAmount.usd.amount) as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: DisplayCurrency.Usd,
  }

  const displaySendEurAmounts = {
    amountDisplayCurrency: 24 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 12 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  const testMetadata = async <S extends WalletCurrency, R extends WalletCurrency>({
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    isSend: isSendForAmount,
    isIntraLedger = false,
    senderDisplayAmounts,
    recipientDisplayAmounts,
  }: {
    senderWalletDescriptor: WalletDescriptor<S>
    recipientWalletDescriptor?: WalletDescriptor<R>
    metadata
    isSend: boolean
    isIntraLedger?: boolean
    senderDisplayAmounts?: DisplayTxnAmountsArg
    recipientDisplayAmounts?: DisplayTxnAmountsArg
  }) => {
    const testCases = [
      {
        walletDescriptor: senderWalletDescriptor,
        displayAmounts: senderDisplayAmounts,
        isSend: isSendForAmount,
      },
      {
        walletDescriptor: recipientWalletDescriptor,
        displayAmounts: recipientDisplayAmounts,
        isSend: !isSendForAmount,
      },
    ]

    for (const {
      walletDescriptor,
      displayAmounts: displayAmountsRaw,
      isSend,
    } of testCases) {
      if (walletDescriptor === undefined || displayAmountsRaw === undefined) {
        continue
      }

      const txns = await LedgerService().getTransactionsByWalletId(walletDescriptor.id)
      if (txns instanceof Error) throw txns
      if (!(txns && txns.length)) throw new Error()
      const txn = txns[0]

      const satsAmount = toSats(
        isSendForAmount ? sendAmount.btc.amount : receiveAmount.btc.amount,
      )
      const centsAmount = toCents(
        isSendForAmount ? sendAmount.usd.amount : receiveAmount.usd.amount,
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
      {
        name: "recordLnFailedPayment",
        recordFn: recordLnFailedPayment,
        metadata: LedgerTransactionType.Payment,
      },
      {
        name: "recordLnFeeReimbursement",
        recordFn: recordLnFeeReimbursement,
        metadata: LedgerTransactionType.LnFeeReimbursement,
      },
    ]

    recordReceiveToTest.forEach(({ name, recordFn, metadata }) => {
      describe(`${name}`, () => {
        const displayAmountsCases = [displayReceiveEurAmounts, displayReceiveUsdAmounts]
        for (const displayAmounts of displayAmountsCases) {
          describe(`wallet has ${displayAmounts.displayCurrency.toLowerCase()} display`, () => {
            it("receives to btc wallet", async () => {
              const btcWalletDescriptor = BtcWalletDescriptor(
                crypto.randomUUID() as WalletId,
              )

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
              const usdWalletDescriptor = UsdWalletDescriptor(
                crypto.randomUUID() as WalletId,
              )
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
        }
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
        const displayAmountsCases = [displaySendEurAmounts, displaySendUsdAmounts]
        for (const displayAmounts of displayAmountsCases) {
          describe(`wallet has ${displayAmounts.displayCurrency.toLowerCase()} display`, () => {
            it("sends from btc wallet", async () => {
              const btcWalletDescriptor = BtcWalletDescriptor(
                crypto.randomUUID() as WalletId,
              )

              const startingBalance =
                await LedgerFacade.getLedgerAccountBalanceForWalletId(btcWalletDescriptor)
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
              const usdWalletDescriptor = UsdWalletDescriptor(
                crypto.randomUUID() as WalletId,
              )

              const startingBalance =
                await LedgerFacade.getLedgerAccountBalanceForWalletId(usdWalletDescriptor)
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
        }
      })
    })
  })

  describe("recordIntraledger", () => {
    const itRecordIntraLedger = ({
      recordFn,
      metadata,
      send,
      receive,
      displaySendAmounts: displaySendAmountsRaw,
      displayReceiveAmounts: displayReceiveAmountsRaw,
    }: {
      recordFn: RecordInternalTxTestFn
      metadata
      send: WalletCurrency
      receive: WalletCurrency
      displaySendAmounts: DisplayTxnAmountsArg
      displayReceiveAmounts: DisplayTxnAmountsArg
    }) => {
      // For expects, since Intraledger transactions metadata removes fee automatically
      const displaySendAmounts: DisplayTxnAmountsArg = {
        ...displaySendAmountsRaw,
        feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
      }

      const displayReceiveAmounts: DisplayTxnAmountsArg = {
        ...displayReceiveAmountsRaw,
        feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
      }

      const title =
        `from ${displaySendAmounts.displayCurrency.toLowerCase()} display ` +
        `to ${displayReceiveAmounts.displayCurrency.toLowerCase()} display`

      it(`${title}`, async () => {
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
          recipientWalletDescriptor,
          metadata,
          isSend: true,
          isIntraLedger: true,
          senderDisplayAmounts: displaySendAmounts,
          recipientDisplayAmounts: displayReceiveAmounts,
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
      const sendReceiveWalletPairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Usd },
      ]

      const sendReceiveDisplayPairs = [
        {
          displaySendAmounts: displaySendEurAmounts,
          displayReceiveAmounts: displaySendEurAmounts,
        },
        {
          displaySendAmounts: displaySendEurAmounts,
          displayReceiveAmounts: displaySendUsdAmounts,
        },
        {
          displaySendAmounts: displaySendUsdAmounts,
          displayReceiveAmounts: displaySendEurAmounts,
        },
        {
          displaySendAmounts: displaySendUsdAmounts,
          displayReceiveAmounts: displaySendUsdAmounts,
        },
      ]

      for (const { send, receive } of sendReceiveWalletPairs) {
        describe(`sends from ${send.toLowerCase()} wallet to ${receive.toLowerCase()} wallet`, () => {
          for (const {
            displaySendAmounts,
            displayReceiveAmounts,
          } of sendReceiveDisplayPairs) {
            itRecordIntraLedger({
              recordFn,
              metadata,
              send,
              receive,
              displaySendAmounts,
              displayReceiveAmounts,
            })
          }
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
      const sendReceiveWalletPairs = [
        { send: WalletCurrency.Btc, receive: WalletCurrency.Usd },
        { send: WalletCurrency.Usd, receive: WalletCurrency.Btc },
      ]

      const sendReceiveDisplayPairs = [
        {
          displaySendAmounts: displaySendEurAmounts,
          displayReceiveAmounts: displaySendEurAmounts,
        },
        {
          displaySendAmounts: displaySendUsdAmounts,
          displayReceiveAmounts: displaySendUsdAmounts,
        },
      ]

      for (const { send, receive } of sendReceiveWalletPairs) {
        describe(`sends from ${send.toLowerCase()} wallet to ${receive.toLowerCase()} wallet`, () => {
          for (const {
            displaySendAmounts,
            displayReceiveAmounts,
          } of sendReceiveDisplayPairs) {
            itRecordIntraLedger({
              recordFn,
              metadata,
              send,
              receive,
              displaySendAmounts,
              displayReceiveAmounts,
            })
          }
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

  describe("recordReceiveOnChainFeeReconciliation", () => {
    const lowerFee = { amount: 1000n, currency: WalletCurrency.Btc }
    const higherFee = { amount: 2100n, currency: WalletCurrency.Btc }
    const feeReconciliationAmount = calc.sub(higherFee, lowerFee)

    it("reimburses (credits) bank owner for overestimate", async () => {
      const estimatedFee = higherFee
      const actualFee = lowerFee

      const { bankOwnerAccountId } = await staticAccountIds()
      const txHash = generateHash() as OnChainTxHash
      const payoutId = crypto.randomUUID() as PayoutId

      const { metadata } = LedgerFacade.OnChainFeeReconciliationLedgerMetadata({
        payoutId,
        txHash,
        pending: true,
      })
      await recordReceiveOnChainFeeReconciliation({
        estimatedFee,
        actualFee,
        metadata,
      })

      const txns = await Transaction.find({ hash: txHash })
      expect(txns.length).toEqual(2)

      const debitTxn = txns.find((txn) => txn.debit > 0)
      if (debitTxn === undefined) throw new Error("debitTxn is undefined")
      expect(debitTxn.accounts).toBe(onChainLedgerAccountId)
      expect(debitTxn.debit).toEqual(Number(feeReconciliationAmount.amount))
      expect(debitTxn).toEqual(
        expect.objectContaining({
          type: LedgerTransactionType.OnchainPayment,
          pending: true,
          payout_id: payoutId,
          hash: txHash,
          currency: WalletCurrency.Btc,
        }),
      )

      const creditTxn = txns.find((txn) => txn.credit > 0)
      if (creditTxn === undefined) throw new Error("creditTxn is undefined")
      expect(creditTxn.accounts).toBe(bankOwnerAccountId)
      expect(creditTxn.credit).toEqual(Number(feeReconciliationAmount.amount))
      expect(creditTxn).toEqual(
        expect.objectContaining({
          type: LedgerTransactionType.OnchainPayment,
          pending: true,
          payout_id: payoutId,
          hash: txHash,
          currency: WalletCurrency.Btc,
        }),
      )
    })

    it("deducts from (debits) bank owner for underestimate", async () => {
      const estimatedFee = lowerFee
      const actualFee = higherFee

      const { bankOwnerAccountId } = await staticAccountIds()
      const txHash = generateHash() as OnChainTxHash
      const payoutId = crypto.randomUUID() as PayoutId

      const { metadata } = LedgerFacade.OnChainFeeReconciliationLedgerMetadata({
        payoutId,
        txHash,
        pending: true,
      })
      await recordReceiveOnChainFeeReconciliation({
        estimatedFee,
        actualFee,
        metadata,
      })

      const txns = await Transaction.find({ hash: txHash })
      expect(txns.length).toEqual(2)

      const debitTxn = txns.find((txn) => txn.debit > 0)
      if (debitTxn === undefined) throw new Error("debitTxn is undefined")
      expect(debitTxn.accounts).toBe(bankOwnerAccountId)
      expect(debitTxn.debit).toEqual(Number(feeReconciliationAmount.amount))
      expect(debitTxn).toEqual(
        expect.objectContaining({
          type: LedgerTransactionType.OnchainPayment,
          pending: true,
          payout_id: payoutId,
          hash: txHash,
          currency: WalletCurrency.Btc,
        }),
      )

      const creditTxn = txns.find((txn) => txn.credit > 0)
      if (creditTxn === undefined) throw new Error("creditTxn is undefined")
      expect(creditTxn.accounts).toBe(onChainLedgerAccountId)
      expect(creditTxn.credit).toEqual(Number(feeReconciliationAmount.amount))
      expect(creditTxn).toEqual(
        expect.objectContaining({
          type: LedgerTransactionType.OnchainPayment,
          pending: true,
          payout_id: payoutId,
          hash: txHash,
          currency: WalletCurrency.Btc,
        }),
      )
    })
  })
})
