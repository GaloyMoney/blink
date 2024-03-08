import { updatePendingPaymentByHash } from "@/app/payments"

import { LedgerTransactionType } from "@/domain/ledger"
import { FAILED_USD_MEMO } from "@/domain/ledger/ln-payment-state"
import { PaymentStatus } from "@/domain/bitcoin/lightning"
import { AmountCalculator, WalletCurrency } from "@/domain/shared"
import * as DisplayAmountsConverterImpl from "@/domain/fiat"

import { baseLogger } from "@/services/logger"
import * as LedgerFacadeImpl from "@/services/ledger/facade"
import * as LndImpl from "@/services/lnd"
import * as MongooseImpl from "@/services/mongoose"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  recordSendLnPayment,
} from "test/helpers"

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()
})

afterEach(() => {
  jest.restoreAllMocks()
})

const samplePaymentRequest =
  "lnbc1pjjahwgpp5zzh9s6tkhpk7heu8jt4l7keuzg7v046p0lzx2hvy3jf6a56w50nqdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqyz5vqsp5vl4zmuvhl8rzy4rmq0g3j28060pv3gqp22rh8l7u45xwyu27928q9qyyssqn9drylhlth9ee320e4ahz52y9rklujqgw0kj9ce2gcmltqk6uuay5yv8vgks0y5tggndv0kek2m2n02lf43znx50237mglxsfw4au2cqqr6qax" as EncodedPaymentRequest

describe("update pending payments", () => {
  const sendAmount = {
    usd: { amount: 20n, currency: WalletCurrency.Usd },
    btc: { amount: 60n, currency: WalletCurrency.Btc },
  }

  const bankFee = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 30n, currency: WalletCurrency.Btc },
  }

  const displaySendEurAmounts = {
    amountDisplayCurrency: 24 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 12 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  it("records transaction with ln-failed-payment metadata on ln update", async () => {
    // Setup mocks
    const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
    jest.spyOn(LndImpl, "LndService").mockReturnValue({
      ...LnServiceOrig(),
      lookupPayment: () => ({
        status: PaymentStatus.Failed,
      }),
    })

    const { LnPaymentsRepository: LnPaymentsRepositoryOrig } =
      jest.requireActual("@/services/mongoose")
    jest.spyOn(MongooseImpl, "LnPaymentsRepository").mockReturnValue({
      ...LnPaymentsRepositoryOrig(),
      findByPaymentHash: () => ({ paymentRequest: samplePaymentRequest }),
    })

    const displayAmountsConverterSpy = jest.spyOn(
      DisplayAmountsConverterImpl,
      "DisplayAmountsConverter",
    )

    const lnFailedPaymentReceiveLedgerMetadataSpy = jest.spyOn(
      LedgerFacadeImpl,
      "LnFailedPaymentReceiveLedgerMetadata",
    )
    const recordOffChainReceiveSpy = jest.spyOn(LedgerFacadeImpl, "recordReceiveOffChain")

    // Setup users and wallets
    const newWalletDescriptor = await createRandomUserAndBtcWallet()

    // Initiate pending ln payment
    const { paymentHash } = await recordSendLnPayment({
      walletDescriptor: newWalletDescriptor,
      paymentAmount: sendAmount,
      bankFee,
      displayAmounts: displaySendEurAmounts,
    })

    // Setup payment-flow mock
    const mockedPaymentFlow = {
      senderWalletCurrency: WalletCurrency.Usd,
      paymentHashForFlow: () => paymentHash,
      senderWalletDescriptor: () => newWalletDescriptor,

      btcPaymentAmount: sendAmount.btc,
      usdPaymentAmount: sendAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
      totalAmountsForPayment: () => ({
        btc: calc.add(sendAmount.btc, bankFee.btc),
        usd: calc.add(sendAmount.usd, bankFee.usd),
      }),
    }

    const { PaymentFlowStateRepository: PaymentFlowStateRepositoryOrig } =
      jest.requireActual("@/services/mongoose")
    jest.spyOn(MongooseImpl, "PaymentFlowStateRepository").mockReturnValue({
      ...PaymentFlowStateRepositoryOrig(),
      markLightningPaymentFlowNotPending: () => mockedPaymentFlow,
    })

    // Call update-pending function
    await updatePendingPaymentByHash({ paymentHash, logger: baseLogger })

    // Check record function was called with right metadata
    expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(0)
    expect(lnFailedPaymentReceiveLedgerMetadataSpy).toHaveBeenCalledTimes(1)
    const args = recordOffChainReceiveSpy.mock.calls[0][0]
    expect(args.metadata.type).toBe(LedgerTransactionType.Payment)
    expect(args.description).toBe(FAILED_USD_MEMO)
  })
})
