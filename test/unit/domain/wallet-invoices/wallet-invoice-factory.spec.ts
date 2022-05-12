import { paymentAmountFromSats, WalletCurrency } from "@domain/shared"
import { MS_PER_DAY } from "@config"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"

let walletInvoiceFactory: WalletInvoiceFactory

beforeAll(async () => {
  const walletId = "id" as WalletId
  const currency = WalletCurrency.Btc
  walletInvoiceFactory = WalletInvoiceFactory({ walletId, currency })
})

describe("wallet invoice factory methods", () => {
  it("translates a registered invoice to wallet invoice", () => {
    const amountInSats = toSats(42)
    const paymentAmount = paymentAmountFromSats(amountInSats)
    if (paymentAmount instanceof Error) throw paymentAmount

    const registeredInvoice: RegisteredInvoice = {
      invoice: {
        paymentHash: "paymentHash" as PaymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: amountInSats,
        paymentAmount,
        milliSatsAmount: toMilliSatsFromNumber(42000),
        description: "",
        features: [],
        expiresAt: new Date(Date.now() + MS_PER_DAY),
        isExpired: false,
      },
      pubkey: "pubkey" as Pubkey,
      descriptionHash: "descriptionHash" as string, // FIXME
    }
    const result = walletInvoiceFactory.createForSelf({
      registeredInvoice,
      cents: toCents(12),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: true,
      pubkey: "pubkey",
      paid: false,
      cents: 12,
      currency: WalletCurrency.Btc,
    }
    expect(result).toEqual(expected)
  })

  it("translates a registered invoice to wallet invoice for a recipient", () => {
    const amountInSats = toSats(42)
    const paymentAmount = paymentAmountFromSats(amountInSats)
    if (paymentAmount instanceof Error) throw paymentAmount

    const registeredInvoice: RegisteredInvoice = {
      invoice: {
        paymentHash: "paymentHash" as PaymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: amountInSats,
        paymentAmount,
        milliSatsAmount: toMilliSatsFromNumber(42000),
        description: "",
        features: [],
        expiresAt: new Date(Date.now() + MS_PER_DAY),
        isExpired: false,
      },
      pubkey: "pubkey" as Pubkey,
    }
    const result = walletInvoiceFactory.createForRecipient({
      registeredInvoice,
      cents: toCents(10),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: false,
      pubkey: "pubkey",
      paid: false,
      cents: 10,
      currency: WalletCurrency.Btc,
    }
    expect(result).toEqual(expected)
  })
})
