import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { WalletCurrency } from "@domain/wallets"

let walletInvoiceFactory: WalletInvoiceFactory

beforeAll(async () => {
  const walletId = "id" as WalletId
  const currency = WalletCurrency.Btc
  walletInvoiceFactory = WalletInvoiceFactory({ walletId, currency })
})

describe("wallet invoice factory methods", () => {
  it("translates a registered invoice to wallet invoice", () => {
    const registeredInvoice: RegisteredInvoice = {
      invoice: {
        paymentHash: "paymentHash" as PaymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: toSats(42),
        milliSatsAmount: toMilliSatsFromNumber(42000),
        description: "",
        features: [],
      },
      pubkey: "pubkey" as Pubkey,
      descriptionHash: "descriptionHash" as string, // FIXME
    }
    const result = walletInvoiceFactory.createForSelf({
      registeredInvoice,
      usdCents: toCents(12),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: true,
      pubkey: "pubkey",
      paid: false,
      usdCents: 12,
      currency: WalletCurrency.Btc,
    }
    expect(result).toEqual(expected)
  })

  it("translates a registered invoice to wallet invoice for a recipient", () => {
    const registeredInvoice = {
      invoice: {
        paymentHash: "paymentHash" as PaymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: toSats(42),
        milliSatsAmount: toMilliSatsFromNumber(42000),
        description: "",
        features: [],
      },
      pubkey: "pubkey" as Pubkey,
      currency: WalletCurrency.Btc,
    }
    const result = walletInvoiceFactory.createForRecipient({
      registeredInvoice,
      usdCents: toCents(10),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: false,
      pubkey: "pubkey",
      paid: false,
      usdCents: 10,
      currency: WalletCurrency.Btc,
    }
    expect(result).toEqual(expected)
  })
})
