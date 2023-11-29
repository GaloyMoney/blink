import { Payments, Wallets } from "@/app"
import { getCurrentPriceAsDisplayPriceRatio } from "@/app/prices"

import {
  MaxFeeTooLargeForRoutelessPaymentError,
  PaymentSendStatus,
} from "@/domain/bitcoin/lightning"
import { sat2btc, toSats } from "@/domain/bitcoin"
import { LedgerTransactionType, UnknownLedgerError } from "@/domain/ledger"
import * as LnFeesImpl from "@/domain/payments"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { UsdDisplayCurrency, displayAmountFromNumber } from "@/domain/fiat"

import { updateDisplayCurrency } from "@/app/accounts"

import { PayoutSpeed } from "@/domain/bitcoin/onchain"

import { translateToLedgerTx } from "@/services/ledger"
import { MainBook, Transaction } from "@/services/ledger/books"
import * as BriaImpl from "@/services/bria"
import { BriaPayloadType } from "@/services/bria"
import { AccountsRepository } from "@/services/mongoose"
import { toObjectId } from "@/services/mongoose/utils"
import { baseLogger } from "@/services/logger"

import {
  utxoDetectedEventHandler,
  utxoSettledEventHandler,
} from "@/servers/event-handlers/bria"

import { sleep } from "@/utils"

import {
  bitcoindClient,
  bitcoindOutside,
  createChainAddress,
  createInvoice,
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getDefaultWalletIdByPhone,
  getPendingTransactionsForWalletId,
  getUsdWalletIdByPhone,
  lndOutside1,
  onceBriaSubscribe,
  RANDOM_ADDRESS,
  randomPhone,
  safePay,
  sendToAddressAndConfirm,
} from "test/helpers"

let accountB: Account
let accountC: Account

let walletIdB: WalletId
let walletIdUsdB: WalletId
let walletIdC: WalletId

const phoneB = randomPhone()
const phoneC = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneC)

  accountB = await getAccountByPhone(phoneB)
  accountC = await getAccountByPhone(phoneC)

  walletIdB = await getDefaultWalletIdByPhone(phoneB)
  walletIdUsdB = await getUsdWalletIdByPhone(phoneB)
  walletIdC = await getDefaultWalletIdByPhone(phoneC)

  await bitcoindClient.loadWallet({ filename: "outside" })

  // Update account display currencies
  const updatedAccountB = await updateDisplayCurrency({
    accountId: accountB.id,
    currency: "EUR",
  })
  if (updatedAccountB instanceof Error) throw updatedAccountB

  const updatedAccountC = await updateDisplayCurrency({
    accountId: accountC.id,
    currency: "CRC",
  })
  if (updatedAccountC instanceof Error) throw updatedAccountC

  const accountBRaw = await AccountsRepository().findById(accountB.id)
  if (accountBRaw instanceof Error) throw accountBRaw
  accountB = accountBRaw
  if (accountB.displayCurrency !== "EUR") {
    throw new Error("Error changing display currency for accountB")
  }

  const accountCRaw = await AccountsRepository().findById(accountC.id)
  if (accountCRaw instanceof Error) throw accountCRaw
  accountC = accountCRaw
  if (accountC.displayCurrency !== "CRC") {
    throw new Error("Error changing display currency for accountC")
  }
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Display properties on transactions", () => {
  const getAllTransactionsByHash = async (
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        hash,
      })
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getAllTransactionsByJournalId = async (
    journalId: LedgerJournalId,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        _journal: toObjectId(journalId),
      })
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getAllTransactionsByMemo = async (
    memoPayer: string,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        memoPayer,
      })
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getDisplayAmounts = async ({
    satsAmount,
    satsFee,
  }: {
    satsAmount: Satoshis
    satsFee: Satoshis
  }) => {
    const currencies = ["EUR" as DisplayCurrency, "CRC" as DisplayCurrency]

    const btcAmount = paymentAmountFromNumber({
      amount: satsAmount,
      currency: WalletCurrency.Btc,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const btcFee = paymentAmountFromNumber({
      amount: satsFee,
      currency: WalletCurrency.Btc,
    })
    if (btcFee instanceof Error) throw btcFee

    const result: Record<
      string,
      {
        displayAmount: DisplayCurrencyBaseAmount
        displayFee: DisplayCurrencyBaseAmount
        displayCurrency: DisplayCurrency
      }
    > = {}
    for (const currency of currencies) {
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency,
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio

      const displayAmount = displayPriceRatio.convertFromWallet(btcAmount)
      if (satsAmount > 0 && displayAmount.amountInMinor === 0n) {
        displayAmount.amountInMinor = 1n
      }

      const displayFee = displayPriceRatio.convertFromWalletToCeil(btcFee)

      result[currency] = {
        displayAmount: Number(displayAmount.amountInMinor) as DisplayCurrencyBaseAmount,
        displayFee: Number(displayFee.amountInMinor) as DisplayCurrencyBaseAmount,
        displayCurrency: currency,
      }
    }

    return result
  }

  describe("ln", () => {
    describe("receive", () => {
      it("(LnReceiveLedgerMetadata) receives payment from outside", async () => {
        // larger amount to not fall below the escrow limit
        const amountInvoice = toSats(100_000)

        const recipientWalletId = walletIdB

        // Receive payment
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: recipientWalletId,
          amount: amountInvoice,
          memo,
        })
        if (invoice instanceof Error) throw invoice
        const { paymentRequest, paymentHash } = invoice.lnInvoice

        const [outsideLndpayResult, updateResult] = await Promise.all([
          safePay({ lnd: lndOutside1, request: paymentRequest }),
          (async () => {
            // TODO: we could use event instead of a sleep to lower test latency
            await sleep(500)
            return Wallets.handleHeldInvoiceByPaymentHash({
              paymentHash,
              logger: baseLogger,
            })
          })(),
        ])
        expect(outsideLndpayResult?.is_confirmed).toBe(true)
        expect(updateResult).not.toBeInstanceOf(Error)

        // Check entries
        const txns = await getAllTransactionsByHash(paymentHash)
        if (txns instanceof Error) throw txns

        const recipientTxn = txns.find(
          ({ walletId, type }) =>
            walletId === recipientWalletId && type === LedgerTransactionType.Invoice,
        )
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(({ walletId }) => walletId !== recipientWalletId)
        expect(internalTxns.length).toBeGreaterThan(0)

        const { EUR: expectedRecipientDisplayProps } = await getDisplayAmounts({
          satsAmount: recipientTxn.satsAmount || toSats(0),
          satsFee: recipientTxn.satsFee || toSats(0),
        })

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedRecipientDisplayProps,
            type: LedgerTransactionType.Invoice,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: recipientTxn.centsAmount,
              displayFee: recipientTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })
    })

    describe("intraledger", () => {
      it("(LnIntraledgerLedgerMetadata) sends to another Galoy user with memo", async () => {
        // TxMetadata:
        // - LnIntraledgerLedgerMetadata

        const amountInvoice = 1_001

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdC

        // Send payment
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: recipientWalletId,
          amount: amountInvoice,
          memo,
        })
        if (invoice instanceof Error) throw invoice
        const { paymentRequest } = invoice.lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: paymentRequest,
          memo: null,
          senderWalletId: senderWalletId,
          senderAccount,
        })
        if (paymentResult instanceof Error) throw paymentResult

        // Check entries
        const txns = await getAllTransactionsByHash(invoice.paymentHash)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(({ walletId }) => walletId === senderWalletId)
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")
        const recipientTxn = txns.find(({ walletId }) => walletId === recipientWalletId)

        const { EUR: expectedSenderDisplayProps, CRC: expectedRecipientDisplayProps } =
          await getDisplayAmounts({
            satsAmount: senderTxn.satsAmount || toSats(0),
            satsFee: senderTxn.satsFee || toSats(0),
          })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.LnIntraLedger,
          }),
        )
        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedRecipientDisplayProps,
            type: LedgerTransactionType.LnIntraLedger,
          }),
        )

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(0)
      })

      it("(LnTradeIntraAccountLedgerMetadata) pay self amountless invoice from btc wallet to usd wallet", async () => {
        // TxMetadata:
        // - LnIntraledgerLedgerMetadata

        const amountInvoice = toSats(100)

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdUsdB

        // Send payment
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const invoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: recipientWalletId,
          memo,
        })
        if (invoice instanceof Error) throw invoice
        const {
          paymentRequest: uncheckedPaymentRequest,
          paymentHash,
          destination,
        } = invoice.lnInvoice

        const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: senderWalletId,
          senderAccount: senderAccount,
          amount: amountInvoice,
        })
        if (paymentResult instanceof Error) throw paymentResult
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "success",
            settlementAmount: amountInvoice * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "lightning",
              paymentHash,
              pubkey: destination,
            }),
            settlementVia: expect.objectContaining({
              type: "intraledger",
            }),
          }),
        })

        // Check entries
        const txns = await getAllTransactionsByHash(paymentHash)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(({ walletId }) => walletId === senderWalletId)
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")
        const recipientTxn = txns.find(({ walletId }) => walletId === recipientWalletId)

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(2)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: senderTxn.satsAmount || toSats(0),
          satsFee: senderTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.LnTradeIntraAccount,
          }),
        )
        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.LnTradeIntraAccount,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })
    })

    describe("send", () => {
      it("(LnFeeReimbursementReceiveLedgerMetadata) pay zero amount invoice", async () => {
        // TxMetadata:
        // - LnSendLedgerMetadata
        // - LnFeeReimbursementReceiveLedgerMetadata

        const amountInvoice = toSats(20_000)

        const senderWalletId = walletIdB

        // Send payment
        const { request, id } = await createInvoice({ lnd: lndOutside1 })
        const paymentHash = id as PaymentHash

        const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
          uncheckedPaymentRequest: request,
          memo: null,
          amount: amountInvoice,
          senderWalletId: walletIdB,
          senderAccount: accountB,
        })
        if (paymentResult instanceof Error) throw paymentResult
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: walletIdB,
            status: "success",
            settlementAmount:
              (amountInvoice + paymentResult.transaction.settlementFee) * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "lightning",
              paymentHash,
            }),
            settlementVia: expect.objectContaining({
              type: "lightning",
            }),
          }),
        })

        // Check entries
        const txns = await getAllTransactionsByHash(paymentHash)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, type }) =>
            walletId === senderWalletId && type === LedgerTransactionType.Payment,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")

        const reimbursementTxn = txns.find(
          ({ walletId, type }) =>
            walletId === senderWalletId &&
            type === LedgerTransactionType.LnFeeReimbursement,
        )
        if (reimbursementTxn === undefined)
          throw new Error("'reimbursementTxn' not found")

        const internalTxns = txns.filter(({ walletId }) => walletId !== senderWalletId)
        expect(internalTxns.length).toBeGreaterThan(0)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: senderTxn.satsAmount || toSats(0),
          satsFee: senderTxn.satsFee || toSats(0),
        })

        const { EUR: expectedReimbursementDisplayProps } = await getDisplayAmounts({
          satsAmount: reimbursementTxn.satsAmount || toSats(0),
          satsFee: reimbursementTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.Payment,
          }),
        )
        expect(reimbursementTxn).toEqual(
          expect.objectContaining({
            ...expectedReimbursementDisplayProps,
            type: LedgerTransactionType.LnFeeReimbursement,
          }),
        )

        expect(internalTxns).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
              type: LedgerTransactionType.Payment,
            }),
            expect.objectContaining({
              displayAmount: reimbursementTxn.centsAmount,
              displayFee: reimbursementTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
              type: LedgerTransactionType.LnFeeReimbursement,
            }),
          ]),
        )
      })

      it("(LnFailedPaymentReceiveLedgerMetadata) pay zero amount invoice & revert txn when verifyMaxFee fails", async () => {
        // TxMetadata:
        // - LnFailedPaymentReceiveLedgerMetadata
        const { LnFees: LnFeesOrig } = jest.requireActual("@/domain/payments")
        const lndFeesSpy = jest.spyOn(LnFeesImpl, "LnFees").mockReturnValue({
          ...LnFeesOrig(),
          verifyMaxFee: () => new MaxFeeTooLargeForRoutelessPaymentError(),
        })

        const senderWalletId = walletIdB
        const senderAccount = accountB

        const amountInvoice = toSats(20_000)

        const { request, id } = await createInvoice({ lnd: lndOutside1 })
        const paymentHash = id as PaymentHash

        const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
          uncheckedPaymentRequest: request,
          memo: null,
          amount: amountInvoice,
          senderWalletId,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
        // Restore system state
        lndFeesSpy.mockReset()

        const txns = await getAllTransactionsByHash(paymentHash)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, debit }) => walletId === senderWalletId && debit > 0,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")

        const repaidTxn = txns.find(
          ({ walletId, credit }) => walletId === senderWalletId && credit > 0,
        )
        if (repaidTxn === undefined) throw new Error("'repaidTxn' not found")

        const internalTxns = txns.filter(({ walletId }) => walletId !== senderWalletId)
        expect(internalTxns.length).toEqual(2)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: senderTxn.satsAmount || toSats(0),
          satsFee: senderTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.Payment,
          }),
        )
        expect(repaidTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.Payment,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })
    })
  })

  describe("onchain", () => {
    const sendToWalletTestWrapper = async ({
      amountSats,
      walletId,
    }: {
      amountSats: Satoshis
      walletId: WalletId
    }) => {
      const address = await Wallets.createOnChainAddress({
        walletId,
      })
      if (address instanceof Error) throw address
      expect(address.substring(0, 4)).toBe("bcrt")

      const txId = await sendToAddressAndConfirm({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
      if (txId instanceof Error) throw txId

      // Register confirmed txn in database
      const detectedEvent = await onceBriaSubscribe({
        type: BriaPayloadType.UtxoDetected,
        txId,
      })
      if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
        throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
      }
      const resultPending = await utxoDetectedEventHandler({
        event: detectedEvent.payload,
      })
      if (resultPending instanceof Error) {
        throw resultPending
      }

      const settledEvent = await onceBriaSubscribe({
        type: BriaPayloadType.UtxoSettled,
        txId,
      })
      if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
        throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
      }
      const resultSettled = await utxoSettledEventHandler({ event: settledEvent.payload })
      if (resultSettled instanceof Error) {
        throw resultSettled
      }

      return txId
    }

    describe("receive", () => {
      it("(OnChainReceiveLedgerMetadata) receives on-chain transaction", async () => {
        // TxMetadata:
        // - OnChainReceiveLedgerMetadata

        const amountSats = toSats(20_000)

        const recipientWalletId = walletIdB

        // Execute receive
        const txId = await sendToWalletTestWrapper({
          walletId: recipientWalletId,
          amountSats,
        })

        // Check entries
        const txns = await getAllTransactionsByHash(txId)
        if (txns instanceof Error) throw txns

        const recipientTxn = txns.find(({ walletId }) => walletId === recipientWalletId)
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(({ walletId }) => walletId !== recipientWalletId)
        expect(internalTxns.length).toBeGreaterThan(0)

        const { EUR: expectedRecipientDisplayProps } = await getDisplayAmounts({
          satsAmount: recipientTxn.satsAmount || toSats(0),
          satsFee: recipientTxn.satsFee || toSats(0),
        })

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedRecipientDisplayProps,
            type: LedgerTransactionType.OnchainReceipt,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: recipientTxn.centsAmount,
              displayFee: recipientTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })

      it("(Pending, no metadata) identifies unconfirmed incoming on-chain transactions", async () => {
        const amountSats = toSats(20_000)

        const recipientWalletId = walletIdB

        // Execute receive
        const address = await Wallets.createOnChainAddress({
          walletId: recipientWalletId,
        })
        if (address instanceof Error) throw address

        const txId = (await bitcoindOutside.sendToAddress({
          address,
          amount: sat2btc(amountSats),
        })) as OnChainTxHash

        const detectedEvent = await onceBriaSubscribe({
          type: BriaPayloadType.UtxoDetected,
          txId,
        })
        if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
          throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
        }
        const resultPending = await utxoDetectedEventHandler({
          event: detectedEvent.payload,
        })
        if (resultPending instanceof Error) {
          throw resultPending
        }

        // Check entries
        const pendingTxs = await getPendingTransactionsForWalletId(recipientWalletId)
        if (pendingTxs instanceof Error) throw pendingTxs

        expect(pendingTxs.length).toBe(1)
        const recipientTxn = pendingTxs[0]

        const { EUR: expectedRecipientDisplayProps } = await getDisplayAmounts({
          satsAmount: toSats(recipientTxn.settlementAmount),
          satsFee: toSats(recipientTxn.settlementFee),
        })

        const settlementDisplayAmountObj = displayAmountFromNumber({
          amount: expectedRecipientDisplayProps.displayAmount,
          currency: expectedRecipientDisplayProps.displayCurrency,
        })
        if (settlementDisplayAmountObj instanceof Error) throw settlementDisplayAmountObj

        const settlementDisplayFeeObj = displayAmountFromNumber({
          amount: expectedRecipientDisplayProps.displayFee,
          currency: expectedRecipientDisplayProps.displayCurrency,
        })
        if (settlementDisplayFeeObj instanceof Error) throw settlementDisplayFeeObj

        const expectedRecipientWalletTxnDisplayProps = {
          settlementDisplayAmount: settlementDisplayAmountObj.displayInMajor,
          settlementDisplayFee: settlementDisplayFeeObj.displayInMajor,
        }

        expect(recipientTxn).toEqual(
          expect.objectContaining(expectedRecipientWalletTxnDisplayProps),
        )
        expect(recipientTxn.settlementDisplayPrice).toEqual(
          expect.objectContaining({
            displayCurrency: expectedRecipientDisplayProps.displayCurrency,
          }),
        )

        // Settle pending
        await bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS })

        const settledEvent = await onceBriaSubscribe({
          type: BriaPayloadType.UtxoSettled,
          txId,
        })
        if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
          throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
        }
        const resultSettled = await utxoSettledEventHandler({
          event: settledEvent.payload,
        })
        if (resultSettled instanceof Error) {
          throw resultSettled
        }
      })
    })

    describe("intraledger", () => {
      it("(OnChainIntraledgerLedgerMetadata) pays another galoy user via onchain address", async () => {
        // TxMetadata:
        // - OnChainIntraledgerLedgerMetadata
        const amountSats = toSats(20_000)

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdC

        // Execute Send
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const address = await Wallets.createOnChainAddress({
          walletId: recipientWalletId,
        })
        if (address instanceof Error) throw address

        const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
          senderAccount,
          senderWalletId,
          address,
          amount: amountSats,
          speed: PayoutSpeed.Fast,
          memo,
        })
        if (paymentResult instanceof Error) throw paymentResult
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "success",
            settlementAmount: amountSats * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "onchain",
              address,
            }),
            settlementVia: expect.objectContaining({
              type: "intraledger",
            }),
          }),
        })

        // Check entries
        const memoTxns = await getAllTransactionsByMemo(memo)
        if (memoTxns instanceof Error) throw memoTxns
        expect(memoTxns.length).toEqual(1)
        const { journalId } = memoTxns[0]
        const txns = await getAllTransactionsByJournalId(journalId)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, debit }) => walletId === senderWalletId && debit > 0,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")

        const recipientTxn = txns.find(
          ({ walletId, credit }) => walletId === recipientWalletId && credit > 0,
        )
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(0)

        const { EUR: expectedSenderDisplayProps, CRC: expectedRecipientDisplayProps } =
          await getDisplayAmounts({
            satsAmount: recipientTxn.satsAmount || toSats(0),
            satsFee: recipientTxn.satsFee || toSats(0),
          })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.OnchainIntraLedger,
          }),
        )

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedRecipientDisplayProps,
            type: LedgerTransactionType.OnchainIntraLedger,
          }),
        )
      })

      it("(OnChainTradeIntraAccountLedgerMetadata) self trade via onchain address", async () => {
        // TxMetadata:
        // - OnChainTradeIntraAccountLedgerMetadata

        const amountSats = toSats(20_000)

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdUsdB

        // Execute Send
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const address = await Wallets.createOnChainAddress({
          walletId: recipientWalletId,
        })
        if (address instanceof Error) throw address

        const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
          senderAccount,
          senderWalletId,
          address,
          amount: amountSats,
          speed: PayoutSpeed.Fast,
          memo,
        })
        if (paymentResult instanceof Error) throw paymentResult
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "success",
            settlementAmount: amountSats * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "onchain",
              address,
            }),
            settlementVia: expect.objectContaining({
              type: "intraledger",
            }),
          }),
        })

        // Check entries
        const memoTxns = await getAllTransactionsByMemo(memo)
        if (memoTxns instanceof Error) throw memoTxns
        expect(memoTxns.length).toEqual(1)
        const { journalId } = memoTxns[0]
        const txns = await getAllTransactionsByJournalId(journalId)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, debit }) => walletId === senderWalletId && debit > 0,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")

        const recipientTxn = txns.find(
          ({ walletId, credit }) => walletId === recipientWalletId && credit > 0,
        )
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(2)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: recipientTxn.satsAmount || toSats(0),
          satsFee: recipientTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.OnChainTradeIntraAccount,
            currency: WalletCurrency.Btc,
          }),
        )

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.OnChainTradeIntraAccount,
            currency: WalletCurrency.Usd,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })
    })

    describe("send", () => {
      it("(OnChainSendLedgerMetadata) sends an onchain payment", async () => {
        // TxMetadata:
        // - OnChainSendLedgerMetadata

        const { OnChainService: OnChainServiceOrig } =
          jest.requireActual("@/services/bria")
        const briaSpy = jest.spyOn(BriaImpl, "OnChainService").mockReturnValue({
          ...OnChainServiceOrig(),
          queuePayoutToAddress: async () => "payoutId" as PayoutId,
        })

        const amountSats = toSats(20_000)

        const senderWalletId = walletIdB
        const senderAccount = accountB

        // Execute Send
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const { address } = await createChainAddress({
          format: "p2wpkh",
          lnd: lndOutside1,
        })

        const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
          senderAccount,
          senderWalletId,
          address,
          amount: amountSats,
          speed: PayoutSpeed.Fast,
          memo,
        })
        if (paymentResult instanceof Error) throw paymentResult
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "pending",
            settlementAmount: (amountSats + paymentResult.transaction.settlementFee) * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "onchain",
              address,
            }),
            settlementVia: expect.objectContaining({
              type: "onchain",
              transactionHash: undefined,
              vout: undefined,
            }),
          }),
        })

        // Check entries
        const txns = await getAllTransactionsByMemo(memo)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, debit }) => walletId === senderWalletId && debit > 0,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")

        const internalTxns = txns.filter(({ walletId }) => walletId !== senderWalletId)
        expect(internalTxns.length).toEqual(2)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: senderTxn.satsAmount || toSats(0),
          satsFee: senderTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.OnchainPayment,
            currency: WalletCurrency.Btc,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }

        // Clean up after test
        await Transaction.deleteMany({ memo })
        briaSpy.mockRestore()
      })
    })
  })

  describe("wallet-id", () => {
    describe("intraledger", () => {
      it("(WalletIdIntraledgerLedgerMetadata) sends to an internal walletId", async () => {
        // TxMetadata:
        // - WalletIdIntraledgerLedgerMetadata

        const amountSats = 20_000

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdC

        // Send payment
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
          senderWalletId,
          senderAccount,
          memo,
          recipientWalletId,
          amount: amountSats,
        })
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "success",
            settlementAmount: amountSats * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "intraledger",
            }),
            settlementVia: expect.objectContaining({
              type: "intraledger",
            }),
          }),
        })

        // Check entries
        const txns = await getAllTransactionsByMemo(memo)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(({ walletId }) => walletId === senderWalletId)
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")
        const recipientTxn = txns.find(({ walletId }) => walletId === recipientWalletId)
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(0)

        const { EUR: expectedSenderDisplayProps, CRC: expectedRecipientDisplayProps } =
          await getDisplayAmounts({
            satsAmount: senderTxn.satsAmount || toSats(0),
            satsFee: senderTxn.satsFee || toSats(0),
          })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.IntraLedger,
            currency: WalletCurrency.Btc,
          }),
        )

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedRecipientDisplayProps,
            type: LedgerTransactionType.IntraLedger,
            currency: WalletCurrency.Btc,
          }),
        )
      })

      it("(WalletIdTradeIntraAccountLedgerMetadata) sends to self WalletId", async () => {
        // TxMetadata:
        // - WalletIdTradeIntraAccountLedgerMetadata

        const amountSats = 10_000

        const senderWalletId = walletIdB
        const senderAccount = accountB
        const recipientWalletId = walletIdUsdB

        // Send payment
        const memo = "invoiceMemo #" + (Math.random() * 1_000_000).toFixed()

        const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
          senderWalletId,
          senderAccount,
          memo,
          recipientWalletId,
          amount: amountSats,
        })
        expect(paymentResult).toEqual({
          status: PaymentSendStatus.Success,
          transaction: expect.objectContaining({
            walletId: senderWalletId,
            status: "success",
            settlementAmount: amountSats * -1,
            settlementCurrency: "BTC",
            initiationVia: expect.objectContaining({
              type: "intraledger",
            }),
            settlementVia: expect.objectContaining({
              type: "intraledger",
            }),
          }),
        })

        // Check entries
        const txns = await getAllTransactionsByMemo(memo)
        if (txns instanceof Error) throw txns

        const senderTxn = txns.find(
          ({ walletId, debit }) => walletId === senderWalletId && debit > 0,
        )
        if (senderTxn === undefined) throw new Error("'senderTxn' not found")
        const recipientTxn = txns.find(
          ({ walletId, credit }) => walletId === recipientWalletId && credit > 0,
        )
        if (recipientTxn === undefined) throw new Error("'recipientTxn' not found")

        const internalTxns = txns.filter(
          ({ walletId }) => walletId !== senderWalletId && walletId !== recipientWalletId,
        )
        expect(internalTxns.length).toEqual(2)

        const { EUR: expectedSenderDisplayProps } = await getDisplayAmounts({
          satsAmount: senderTxn.satsAmount || toSats(0),
          satsFee: senderTxn.satsFee || toSats(0),
        })

        expect(senderTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.WalletIdTradeIntraAccount,
            currency: WalletCurrency.Btc,
          }),
        )

        expect(recipientTxn).toEqual(
          expect.objectContaining({
            ...expectedSenderDisplayProps,
            type: LedgerTransactionType.WalletIdTradeIntraAccount,
            currency: WalletCurrency.Usd,
          }),
        )

        for (const txn of internalTxns) {
          expect(txn).toEqual(
            expect.objectContaining({
              displayAmount: senderTxn.centsAmount,
              displayFee: senderTxn.centsFee,
              displayCurrency: UsdDisplayCurrency,
            }),
          )
        }
      })
    })
  })
})
