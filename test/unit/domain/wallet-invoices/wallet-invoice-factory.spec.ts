import { MS_PER_DAY } from "@config"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { getSecretAndPaymentHash } from "@domain/bitcoin/lightning"
import { toCents } from "@domain/fiat"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { WalletCurrency } from "@domain/shared"

let walletInvoiceFactory: WalletInvoiceFactory

beforeAll(async () => {
  const walletId = "id" as WalletId
  const currency = WalletCurrency.Btc
  walletInvoiceFactory = WalletInvoiceFactory({ walletId, currency })
})

const { secret, paymentHash } = getSecretAndPaymentHash()

describe("wallet invoice factory methods", () => {
  it("translates a registered invoice to wallet invoice", () => {
    const registeredInvoice: RegisteredInvoice = {
      invoice: {
        paymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: toSats(42),
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
      secret,
    })
    const expected = {
      paymentHash,
      secret,
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
    const registeredInvoice: RegisteredInvoice = {
      invoice: {
        paymentHash,
        paymentSecret: "paymentSecret" as PaymentIdentifyingSecret,
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
        routeHints: [],
        cltvDelta: null,
        destination: "destination" as Pubkey,
        amount: toSats(42),
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
      secret,
    })
    const expected = {
      paymentHash,
      secret,
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
