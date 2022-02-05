import { toMilliSatsFromBigInt, toSats } from "@domain/bitcoin"
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
        cltvDelta: undefined,
        destination: "destination" as Pubkey,
        amount: toSats(42n),
        milliSatsAmount: toMilliSatsFromBigInt(42_000n),
        description: "",
        features: [],
      },
      pubkey: "pubkey" as Pubkey,
      descriptionHash: "descriptionHash" as string, // FIXME
    }
    const result = walletInvoiceFactory.createForSelf({
      registeredInvoice,
      usdCents: toCents(12n),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: true,
      pubkey: "pubkey",
      paid: false,
      usdCents: 12n,
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
        cltvDelta: undefined,
        destination: "destination" as Pubkey,
        amount: toSats(42n),
        milliSatsAmount: toMilliSatsFromBigInt(42_000n),
        description: "",
        features: [],
      },
      pubkey: "pubkey" as Pubkey,
      currency: WalletCurrency.Btc,
    }
    const result = walletInvoiceFactory.createForRecipient({
      registeredInvoice,
      usdCents: toCents(10n),
    })
    const expected = {
      paymentHash: "paymentHash",
      walletId: "id",
      selfGenerated: false,
      pubkey: "pubkey",
      paid: false,
      usdCents: 10n,
      currency: WalletCurrency.Btc,
    }
    expect(result).toEqual(expected)
  })
})
