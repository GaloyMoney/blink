import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType, UnknownLedgerError } from "@domain/ledger"
import {
  InvalidTransactionForPaymentFlowError,
  PaymentFlowFromLedgerTransaction,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"

describe("PaymentFlowFromLedgerTransaction", () => {
  const satsAmount = toSats(20_000)
  const centsAmount = toCents(1_000)
  const satsFee = toSats(400)
  const centsFee = toCents(20)

  const timestamp = new Date()

  const ledgerTxBase = {
    walletId: "walletId" as WalletId,
    paymentHash: "paymentHash" as PaymentHash,
    satsAmount,
    centsAmount,
    satsFee,
    centsFee,
    timestamp,
    type: LedgerTransactionType.Payment,
  }

  const expectedPaymentFlowStateBase = {
    senderWalletId: "walletId" as WalletId,
    settlementMethod: SettlementMethod.Lightning,
    paymentInitiationMethod: PaymentInitiationMethod.Lightning,

    paymentHash: "paymentHash" as PaymentHash,
    descriptionFromInvoice: "",
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

    btcProtocolFee: {
      amount: BigInt(satsFee),
      currency: WalletCurrency.Btc,
    },
    usdProtocolFee: {
      amount: BigInt(centsFee),
      currency: WalletCurrency.Usd,
    },
  }

  it("builds correct PaymentFlow from btc transaction", () => {
    const ledgerTx = {
      ...ledgerTxBase,
      currency: WalletCurrency.Btc,
    } as LedgerTransaction<WalletCurrency>
    const paymentFlow = PaymentFlowFromLedgerTransaction(ledgerTx)
    expect(paymentFlow).not.toBeInstanceOf(Error)

    const expectedPaymentFlowState = {
      ...expectedPaymentFlowStateBase,
      senderWalletCurrency: WalletCurrency.Btc,
      inputAmount: BigInt(satsAmount),
    }
    expect(paymentFlow).toEqual(expect.objectContaining(expectedPaymentFlowState))
  })

  it("builds correct PaymentFlow from usd transaction", () => {
    const ledgerTx = {
      ...ledgerTxBase,
      currency: WalletCurrency.Usd,
    } as LedgerTransaction<WalletCurrency>
    const paymentFlow = PaymentFlowFromLedgerTransaction(ledgerTx)
    expect(paymentFlow).not.toBeInstanceOf(Error)

    const expectedPaymentFlowState = {
      ...expectedPaymentFlowStateBase,
      senderWalletCurrency: WalletCurrency.Usd,
      inputAmount: BigInt(centsAmount),
    }
    expect(paymentFlow).toEqual(expect.objectContaining(expectedPaymentFlowState))
  })

  it("returns error for transaction with missing walletId", () => {
    const ledgerTx = {
      ...ledgerTxBase,
      walletId: undefined,
    } as LedgerTransaction<WalletCurrency>
    const paymentFlow = PaymentFlowFromLedgerTransaction(ledgerTx)
    expect(paymentFlow).toBeInstanceOf(UnknownLedgerError)
  })

  it("returns error for transaction with wrong type", () => {
    const ledgerTx = {
      ...ledgerTxBase,
      type: LedgerTransactionType.LnIntraLedger,
    } as LedgerTransaction<WalletCurrency>
    const paymentFlow = PaymentFlowFromLedgerTransaction(ledgerTx)
    expect(paymentFlow).toBeInstanceOf(InvalidTransactionForPaymentFlowError)
  })
})
