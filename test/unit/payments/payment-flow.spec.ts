import { toSats } from "@domain/bitcoin"
import { InsufficientBalanceError, InvalidCurrencyForWalletError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { inputAmountFromLedgerTransaction } from "@domain/ledger"
import { PaymentFlow } from "@domain/payments"
import { WalletCurrency, safeBigInt } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"

describe("PaymentFlowFromLedgerTransaction", () => {
  const satsAmount = toSats(20_000)
  const centsAmount = toCents(1_000)
  const satsFee = toSats(400)
  const centsFee = toCents(20)
  const timestamp = new Date()

  const paymentFlowState: PaymentFlowState<WalletCurrency, WalletCurrency> = {
    senderWalletId: "walletId" as WalletId,
    senderAccountId: "accountId" as AccountId,
    settlementMethod: SettlementMethod.Lightning,
    paymentInitiationMethod: PaymentInitiationMethod.Lightning,

    paymentHash: "paymentHash" as PaymentHash,
    descriptionFromInvoice: "",
    skipProbeForDestination: false,
    createdAt: timestamp,
    paymentSentAndPending: true,

    btcPaymentAmount: {
      amount: BigInt(satsAmount),
      currency: WalletCurrency.Btc,
    },
    usdPaymentAmount: {
      amount: BigInt(centsAmount),
      currency: WalletCurrency.Usd,
    },

    inputAmount: undefined as unknown as bigint,
    senderWalletCurrency: undefined as unknown as WalletCurrency,

    btcProtocolFee: {
      amount: BigInt(satsFee),
      currency: WalletCurrency.Btc,
    },
    usdProtocolFee: {
      amount: BigInt(centsFee),
      currency: WalletCurrency.Usd,
    },
  }

  const walletsToTest = [
    {
      name: "btc",
      senderCurrency: WalletCurrency.Btc,
      sendAmount: BigInt(satsAmount + satsFee),
      inputAmount: BigInt(satsAmount),
    },
    {
      name: "usd",
      senderCurrency: WalletCurrency.Usd,
      sendAmount: BigInt(centsAmount + centsFee),
      inputAmount: BigInt(centsAmount),
    },
  ]
  describe("checkBalanceForSend", () => {
    for (const { name, senderCurrency, sendAmount, inputAmount } of walletsToTest) {
      describe(`${name} sending wallet`, () => {
        const paymentFlow = PaymentFlow({
          ...paymentFlowState,
          inputAmount,
          senderWalletCurrency: senderCurrency,
        })

        it("passes for send amount under balance", () => {
          const balanceForSend = {
            amount: sendAmount + 1n,
            currency: senderCurrency,
          }
          const check = paymentFlow.checkBalanceForSend(balanceForSend)
          expect(check).not.toBeInstanceOf(Error)
          expect(check).toBe(true)
        })

        it("passes for send amount equal to balance", () => {
          const balanceForSend = {
            amount: sendAmount,
            currency: senderCurrency,
          }
          const check = paymentFlow.checkBalanceForSend(balanceForSend)
          expect(check).not.toBeInstanceOf(Error)
          expect(check).toBe(true)
        })

        it("fails for send amount above to balance", () => {
          const balanceForSend = {
            amount: sendAmount - 1n,
            currency: senderCurrency,
          }
          const check = paymentFlow.checkBalanceForSend(balanceForSend)
          expect(check).toBeInstanceOf(InsufficientBalanceError)
        })

        it("fails for wrong balance currency", () => {
          const balanceForSend = {
            amount: sendAmount + 1n,
            currency:
              senderCurrency === WalletCurrency.Btc
                ? WalletCurrency.Usd
                : WalletCurrency.Btc,
          }
          const check = paymentFlow.checkBalanceForSend(balanceForSend)
          expect(check).toBeInstanceOf(InvalidCurrencyForWalletError)
        })
      })
    }
  })

  describe("inputAmountFromLedgerTransaction", () => {
    const baseLedgerTransaction = {
      fee: toSats(1),
      usd: 0.2,
      feeUsd: 0.01,

      satsAmount: toSats(1000),
      centsAmount: toCents(20),
      satsFee: toSats(1),
      centsFee: toCents(1),
      displayAmount: 20 as DisplayCurrencyBaseAmount,
      displayFee: 1 as DisplayCurrencyBaseAmount,
      displayCurrency: "USD",
    }

    const btcLedgerTransaction = {
      debit: toSats(1001),
      credit: toSats(0),
      currency: "BTC",
      ...baseLedgerTransaction,
    } as LedgerTransaction<"BTC">

    const usdLedgerTransaction = {
      debit: toCents(21),
      credit: toCents(0),
      currency: "USD",
      ...baseLedgerTransaction,
    } as LedgerTransaction<"USD">

    it("calculates the correct input amount given a BTC LedgerTransaction", () => {
      const inputAmount = inputAmountFromLedgerTransaction(btcLedgerTransaction)
      expect(inputAmount).not.toBeInstanceOf(Error)

      const satsAmount = safeBigInt(baseLedgerTransaction.satsAmount)
      expect(satsAmount).not.toBeInstanceOf(Error)

      expect(inputAmount).toEqual(satsAmount)
    })

    it("calculates the correct input amount given a USD LedgerTransaction", () => {
      const inputAmount = inputAmountFromLedgerTransaction(usdLedgerTransaction)
      expect(inputAmount).not.toBeInstanceOf(Error)

      const centsAmount = safeBigInt(baseLedgerTransaction.centsAmount)
      expect(centsAmount).not.toBeInstanceOf(Error)

      expect(inputAmount).toEqual(centsAmount)
    })
  })
})
