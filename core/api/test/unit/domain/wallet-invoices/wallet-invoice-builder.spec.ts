import { toSats } from "@/domain/bitcoin"
import { sha256 } from "@/domain/bitcoin/lightning"
import { checkedToMinutes } from "@/domain/primitives"
import {
  BtcPaymentAmount,
  UsdPaymentAmount,
  WalletCurrency,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
} from "@/domain/shared"
import {
  InvalidWalletInvoiceBuilderStateError,
  SubOneCentSatAmountForUsdReceiveError,
} from "@/domain/wallet-invoices/errors"
import { WalletInvoiceBuilder } from "@/domain/wallet-invoices/wallet-invoice-builder"

describe("WalletInvoiceBuilder", () => {
  const recipientBtcWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
  }
  const recipientUsdWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
  }
  const uncheckedAmount = 100
  const dealerPriceRatio = 2n
  const btcFromUsd = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount * dealerPriceRatio,
      currency: WalletCurrency.Btc,
    })
  }
  const usdFromBtc = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount / dealerPriceRatio,
      currency: WalletCurrency.Usd,
    })
  }

  const registerInvoice = async (args: RegisterInvoiceArgs) => {
    const amount = toSats(args.btcPaymentAmount.amount)

    const lnInvoice = {
      destination: "pubkey" as Pubkey,
      paymentHash: args.paymentHash,
      paymentRequest: "paymentRequest" as EncodedPaymentRequest,
      milliSatsAmount: (amount * 1000) as MilliSatoshis,
      description: args.description,
      cltvDelta: null,
      amount,
      paymentAmount: args.btcPaymentAmount,
      routeHints: [[]],
      paymentSecret: null,
      features: [],
      expiresAt: args.expiresAt,
      isExpired: false,
    }

    const invoice: RegisteredInvoice = {
      invoice: lnInvoice,
      pubkey: "pubkey" as Pubkey,
      descriptionHash: args.descriptionHash,
    }

    return invoice
  }

  const WIB = WalletInvoiceBuilder({
    dealerBtcFromUsd: btcFromUsd,
    dealerUsdFromBtc: usdFromBtc,
    lnRegisterInvoice: registerInvoice,
  })

  const checkSecretAndHash = (walletInvoice: WalletInvoice) => {
    const { secret, lnInvoice } = walletInvoice
    const hashFromSecret = sha256(Buffer.from(secret, "hex"))
    expect(hashFromSecret).toEqual(walletInvoice.paymentHash)
    expect(walletInvoice.paymentHash).toEqual(lnInvoice.paymentHash)
    expect(lnInvoice).not.toHaveProperty("secret")
  }

  const testExternalId = "testExternalId" as LedgerExternalId
  const WIBWithExternalId = WIB.withExternalId(testExternalId)
  const checkMetadata = ({ externalId }: WalletInvoice) => {
    expect(externalId).toEqual(testExternalId)
  }

  const testDescription = "testdescription"
  const WIBWithDescription = WIBWithExternalId.withDescription({
    description: testDescription,
  })
  const checkDescription = ({ lnInvoice }: WalletInvoice) => {
    expect(lnInvoice.description).toEqual(testDescription)
  }

  const expirationInMinutes = checkedToMinutes(3)
  if (expirationInMinutes instanceof Error) throw expirationInMinutes
  const testExpiration = new Date("2000-01-01T00:03:00.000Z")
  const checkExpiration = ({ lnInvoice }: WalletInvoice) => {
    expect(lnInvoice.expiresAt).toEqual(testExpiration)
  }

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2000-01-01T00:00:00.000Z"))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe("generated for self", () => {
    const WIBWithCreator = WIBWithDescription.generatedForSelf()
    const checkCreator = (walletInvoice: WalletInvoice) => {
      expect(walletInvoice.selfGenerated).toEqual(true)
    }

    describe("with btc recipient wallet", () => {
      const WIBWithRecipient = WIBWithCreator.withRecipientWallet(recipientBtcWallet)
      const checkRecipientWallet = (walletInvoice: WalletInvoice) => {
        expect(walletInvoice.recipientWalletDescriptor).toEqual(recipientBtcWallet)
      }

      describe("with amount", () => {
        it("registers and persists invoice with no conversion", async () => {
          const btcCheckedAmount = checkedToBtcPaymentAmount(uncheckedAmount)
          if (btcCheckedAmount instanceof Error) throw btcCheckedAmount
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withAmount(
              btcCheckedAmount,
            )

          if (WIBWithAmount instanceof Error) throw WIBWithAmount
          const checkAmount = (walletInvoice: WalletInvoice) => {
            expect(walletInvoice.lnInvoice).toEqual(
              expect.objectContaining({
                amount: uncheckedAmount as Satoshis,
                paymentAmount: btcCheckedAmount,
                milliSatsAmount: (1000 * uncheckedAmount) as MilliSatoshis,
              }),
            )
            expect(walletInvoice).toEqual(
              expect.objectContaining({
                usdAmount: undefined,
                paid: false,
              }),
            )
          }

          const invoices = await WIBWithAmount.registerInvoice()
          if (invoices instanceof Error) throw invoices

          checkSecretAndHash(invoices)
          checkAmount(invoices)
          checkMetadata(invoices)
          checkDescription(invoices)
          checkCreator(invoices)
          checkRecipientWallet(invoices)
          checkExpiration(invoices)
        })

        it("fails to register and persist invoice with usd amount", async () => {
          const usdCheckedAmount = checkedToUsdPaymentAmount(uncheckedAmount)
          if (usdCheckedAmount instanceof Error) throw usdCheckedAmount
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withAmount(
              usdCheckedAmount,
            )
          expect(WIBWithAmount).toBeInstanceOf(InvalidWalletInvoiceBuilderStateError)
        })
      })

      describe("with no amount", () => {
        it("registers and persists invoice", async () => {
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withoutAmount()

          if (WIBWithAmount instanceof Error) throw WIBWithAmount
          const checkAmount = (walletInvoice: WalletInvoice) => {
            expect(walletInvoice.lnInvoice).toEqual(
              expect.objectContaining({
                amount: 0 as Satoshis,
                paymentAmount: BtcPaymentAmount(BigInt(0)),
                milliSatsAmount: 0 as MilliSatoshis,
              }),
            )
            expect(walletInvoice).toEqual(
              expect.objectContaining({
                usdAmount: undefined,
                paid: false,
              }),
            )
          }
          const invoices = await WIBWithAmount.registerInvoice()

          if (invoices instanceof Error) throw invoices

          checkSecretAndHash(invoices)
          checkAmount(invoices)
          checkMetadata(invoices)
          checkDescription(invoices)
          checkCreator(invoices)
          checkRecipientWallet(invoices)
          checkExpiration(invoices)
        })
      })
    })

    describe("with usd recipient wallet", () => {
      const WIBWithRecipient = WIBWithCreator.withRecipientWallet(recipientUsdWallet)
      const checkRecipientWallet = (walletInvoice: WalletInvoice) => {
        expect(walletInvoice.recipientWalletDescriptor).toEqual(recipientUsdWallet)
      }

      describe("with amount", () => {
        it("registers and persists invoice with conversion, usd amount", async () => {
          const usdCheckedAmount = checkedToUsdPaymentAmount(uncheckedAmount)
          if (usdCheckedAmount instanceof Error) throw usdCheckedAmount
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withAmount(
              usdCheckedAmount,
            )

          if (WIBWithAmount instanceof Error) throw WIBWithAmount
          const checkAmount = (walletInvoice: WalletInvoice) => {
            const convertedAmount = BigInt(uncheckedAmount) * dealerPriceRatio
            expect(walletInvoice.lnInvoice).toEqual(
              expect.objectContaining({
                amount: Number(convertedAmount) as Satoshis,
                paymentAmount: BtcPaymentAmount(convertedAmount),
                milliSatsAmount: (1000 * Number(convertedAmount)) as MilliSatoshis,
              }),
            )
            expect(walletInvoice).toEqual(
              expect.objectContaining({
                usdAmount: usdCheckedAmount,
                paid: false,
              }),
            )
          }
          const invoices = await WIBWithAmount.registerInvoice()

          if (invoices instanceof Error) throw invoices

          checkSecretAndHash(invoices)
          checkAmount(invoices)
          checkMetadata(invoices)
          checkDescription(invoices)
          checkCreator(invoices)
          checkRecipientWallet(invoices)
          checkExpiration(invoices)
        })

        it("registers and persists invoice with conversion, btc amount", async () => {
          const btcCheckedAmount = checkedToBtcPaymentAmount(uncheckedAmount)
          if (btcCheckedAmount instanceof Error) throw btcCheckedAmount
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withAmount(
              btcCheckedAmount,
            )

          if (WIBWithAmount instanceof Error) throw WIBWithAmount
          const checkAmount = (walletInvoice: WalletInvoice) => {
            expect(walletInvoice.lnInvoice).toEqual(
              expect.objectContaining({
                amount: Number(uncheckedAmount) as Satoshis,
                paymentAmount: btcCheckedAmount,
                milliSatsAmount: (1000 * Number(uncheckedAmount)) as MilliSatoshis,
              }),
            )

            const convertedAmount = BigInt(uncheckedAmount) / dealerPriceRatio
            expect(walletInvoice).toEqual(
              expect.objectContaining({
                usdAmount: UsdPaymentAmount(convertedAmount),
                paid: false,
              }),
            )
          }
          const invoices = await WIBWithAmount.registerInvoice()

          if (invoices instanceof Error) throw invoices

          checkSecretAndHash(invoices)
          checkAmount(invoices)
          checkMetadata(invoices)
          checkDescription(invoices)
          checkCreator(invoices)
          checkRecipientWallet(invoices)
          checkExpiration(invoices)
        })

        it("fails to register and persist invoice with conversion for sub-1-cent amount", async () => {
          const uncheckedAmount = 1
          const btcCheckedAmount = checkedToBtcPaymentAmount(uncheckedAmount)
          if (btcCheckedAmount instanceof Error) throw btcCheckedAmount
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withAmount(
              btcCheckedAmount,
            )
          expect(WIBWithAmount).toBeInstanceOf(SubOneCentSatAmountForUsdReceiveError)
        })
      })

      describe("with no amount", () => {
        it("registers and persists invoice", async () => {
          const WIBWithAmount =
            await WIBWithRecipient.withExpiration(expirationInMinutes).withoutAmount()

          if (WIBWithAmount instanceof Error) throw WIBWithAmount
          const checkAmount = (walletInvoice: WalletInvoice) => {
            expect(walletInvoice.lnInvoice).toEqual(
              expect.objectContaining({
                amount: 0 as Satoshis,
                paymentAmount: BtcPaymentAmount(BigInt(0)),
                milliSatsAmount: 0 as MilliSatoshis,
              }),
            )
            expect(walletInvoice).toEqual(
              expect.objectContaining({
                usdAmount: undefined,
                paid: false,
              }),
            )
          }

          const invoices = await WIBWithAmount.registerInvoice()

          if (invoices instanceof Error) throw invoices

          checkSecretAndHash(invoices)
          checkAmount(invoices)
          checkMetadata(invoices)
          checkDescription(invoices)
          checkCreator(invoices)
          checkRecipientWallet(invoices)
          checkExpiration(invoices)
        })
      })
    })
  })
})
