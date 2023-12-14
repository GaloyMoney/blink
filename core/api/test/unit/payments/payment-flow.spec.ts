import { toSats } from "@/domain/bitcoin"
import { InsufficientBalanceError, InvalidCurrencyForWalletError } from "@/domain/errors"
import { toCents } from "@/domain/fiat"
import { inputAmountFromLedgerTransaction } from "@/domain/ledger"
import { OnChainPaymentFlow, PaymentFlow } from "@/domain/payments"
import { WalletCurrency, safeBigInt, AmountCalculator } from "@/domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@/domain/wallets"

const calc = AmountCalculator()

const btcPaymentAmount = { amount: BigInt(20_000), currency: WalletCurrency.Btc }
const usdPaymentAmount = { amount: BigInt(1_000), currency: WalletCurrency.Usd }
const btcProtocolAndBankFee = { amount: BigInt(400), currency: WalletCurrency.Btc }
const usdProtocolAndBankFee = { amount: BigInt(20), currency: WalletCurrency.Usd }
const btcBankFee = { amount: BigInt(40), currency: WalletCurrency.Btc }
const usdBankFee = { amount: BigInt(2), currency: WalletCurrency.Usd }
const timestamp = new Date()

const walletsToTest = [
  {
    name: "btc",
    sendAmount: calc.add(btcPaymentAmount, btcProtocolAndBankFee),
    inputAmount: btcPaymentAmount.amount,
  },
  {
    name: "usd",
    sendAmount: calc.add(usdPaymentAmount, usdProtocolAndBankFee),
    inputAmount: usdPaymentAmount.amount,
  },
]

const runCheckBalanceTests = <S extends WalletCurrency, R extends WalletCurrency>({
  name,
  paymentFlow,
}: {
  name: string
  paymentFlow: PaymentFlow<S, R> | OnChainPaymentFlow<S, R>
}) => {
  const sendAmount =
    paymentFlow.senderWalletCurrency === WalletCurrency.Btc
      ? paymentFlow.totalAmountsForPayment().btc
      : paymentFlow.totalAmountsForPayment().usd

  describe("checkBalanceForSend", () => {
    describe(`${name} sending wallet`, () => {
      it("passes for send amount under balance", () => {
        const balanceForSend = {
          amount: sendAmount.amount + 1n,
          currency: sendAmount.currency as S,
        }
        const check = paymentFlow.checkBalanceForSend(balanceForSend)
        expect(check).not.toBeInstanceOf(Error)
        expect(check).toBe(true)
      })

      it("passes for send amount equal to balance", () => {
        const balanceForSend = sendAmount as BalanceAmount<S>
        const check = paymentFlow.checkBalanceForSend(balanceForSend)
        expect(check).not.toBeInstanceOf(Error)
        expect(check).toBe(true)
      })

      it("fails for send amount above balance", () => {
        const balanceForSend = {
          amount: sendAmount.amount - 1n,
          currency: sendAmount.currency as S,
        }
        const check = paymentFlow.checkBalanceForSend(balanceForSend)
        expect(check).toBeInstanceOf(InsufficientBalanceError)
      })

      it("fails for wrong balance currency", () => {
        const balanceForSend = {
          amount: sendAmount.amount + 1n,
          currency:
            sendAmount.currency === WalletCurrency.Btc
              ? (WalletCurrency.Usd as S)
              : (WalletCurrency.Btc as S),
        }
        const check = paymentFlow.checkBalanceForSend(balanceForSend)
        expect(check).toBeInstanceOf(InvalidCurrencyForWalletError)
      })
    })
  })
}

describe("LightningPaymentFlowFromLedgerTransaction", <S extends WalletCurrency, R extends
  WalletCurrency>() => {
  const paymentFlowState: PaymentFlowState<S, R> = {
    senderWalletId: "walletId" as WalletId,
    senderAccountId: "AccountId" as AccountId,
    settlementMethod: SettlementMethod.Lightning,
    paymentInitiationMethod: PaymentInitiationMethod.Lightning,

    paymentHash: "paymentHash" as PaymentHash,
    descriptionFromInvoice: "",
    skipProbeForDestination: false,
    createdAt: timestamp,
    paymentSentAndPending: true,

    btcPaymentAmount,
    usdPaymentAmount,

    inputAmount: undefined as unknown as bigint,
    senderWalletCurrency: undefined as unknown as S,

    btcProtocolAndBankFee,
    usdProtocolAndBankFee,
  }

  for (const { name, sendAmount, inputAmount } of walletsToTest) {
    const paymentFlow = PaymentFlow<S, R>({
      ...paymentFlowState,
      inputAmount,
      senderWalletCurrency: sendAmount.currency as S,
    })
    if (paymentFlow instanceof Error) throw paymentFlow

    runCheckBalanceTests({ name, paymentFlow })
  }
})

describe("OnChainPaymentFlowFromLedgerTransaction", <S extends WalletCurrency, R extends
  WalletCurrency>() => {
  const onChainPaymentFlowState: OnChainPaymentFlowState<S, R> = {
    senderWalletId: "walletId" as WalletId,
    senderAccountId: "AccountId" as AccountId,
    settlementMethod: SettlementMethod.Lightning,
    paymentInitiationMethod: PaymentInitiationMethod.Lightning,

    address: "OnChainAddress" as OnChainAddress,
    createdAt: timestamp,
    paymentSentAndPending: true,

    btcPaymentAmount,
    usdPaymentAmount,

    inputAmount: undefined as unknown as bigint,
    senderWalletCurrency: undefined as unknown as S,

    btcProtocolAndBankFee,
    usdProtocolAndBankFee,
    btcBankFee,
    usdBankFee,
  }

  for (const { name, sendAmount, inputAmount } of walletsToTest) {
    const onChainPaymentFlow = OnChainPaymentFlow({
      ...onChainPaymentFlowState,
      inputAmount,
      senderWalletCurrency: sendAmount.currency,
    })
    if (onChainPaymentFlow instanceof Error) throw onChainPaymentFlow

    runCheckBalanceTests({ name, paymentFlow: onChainPaymentFlow })
  }
})

describe("inputAmountFromLedgerTransaction", () => {
  const baseLedgerTransaction = {
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
