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
import { MainBook } from "@/services/ledger/books"
import { BriaPayloadType } from "@/services/bria"
import { AccountsRepository } from "@/services/mongoose"
import { toObjectId } from "@/services/mongoose/utils"

import {
  utxoDetectedEventHandler,
  utxoSettledEventHandler,
} from "@/servers/event-handlers/bria"

import {
  bitcoindClient,
  bitcoindOutside,
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
    describe("send", () => {
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
    describe("receive", () => {
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
  })
})
