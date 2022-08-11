import crypto from "crypto"

import { MS_PER_DAY } from "@config"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
} from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { toSats } from "@domain/bitcoin"

import { LedgerService } from "@services/ledger"

import {
  recordLnIntraLedgerPayment,
  recordLnFeeReimbursement,
  recordReceiveLnPayment,
  recordSendLnPayment,
  recordSendOnChainPayment,
  recordReceiveOnChainPayment,
  recordWalletIdIntraLedgerPayment,
  recordOnChainIntraLedgerPayment,
  recordLnChannelOpenOrClosingFee,
  recordLndEscrowCredit,
  recordLndEscrowDebit,
  recordLnRoutingRevenue,
  recordColdStorageTxReceive,
  recordColdStorageTxSend,
} from "./helpers"

const ledgerService = LedgerService()
const calc = AmountCalculator()

describe("Withdrawal volumes", () => {
  const timestamp1DayAgo = new Date(Date.now() - MS_PER_DAY)
  const walletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
  const walletDescriptorOther = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

  const receiveAmount = {
    usd: { amount: 100n, currency: WalletCurrency.Usd },
    btc: { amount: 200n, currency: WalletCurrency.Btc },
  }
  const sendAmount = {
    usd: { amount: 200n, currency: WalletCurrency.Usd },
    btc: { amount: 400n, currency: WalletCurrency.Btc },
  }
  const zeroAmount = {
    usd: ZERO_CENTS,
    btc: ZERO_SATS,
  }
  const bankFee = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 20n, currency: WalletCurrency.Btc },
  }

  const withdrawalTypes: LedgerTransactionTypeKey[] = ["Payment", "OnchainPayment"]
  const nonWithdrawalTypes = Object.keys(LedgerTransactionType)
    .map((key) => key as LedgerTransactionTypeKey)
    .filter((key: LedgerTransactionTypeKey) => !withdrawalTypes.includes(key))
  console.log(nonWithdrawalTypes)

  const fetchWithdrawalVolumeAmount = async <S extends WalletCurrency>(
    walletDescriptor: WalletDescriptor<S>,
  ): Promise<PaymentAmount<S>> => {
    const walletVolume = await ledgerService.externalPaymentVolumeSince({
      walletId: walletDescriptor.id,
      timestamp: timestamp1DayAgo,
    })
    expect(walletVolume).not.toBeInstanceOf(Error)
    if (walletVolume instanceof Error) throw walletVolume

    const walletVolumeAmount = await ledgerService.externalPaymentVolumeAmountSince({
      walletDescriptor,
      timestamp: timestamp1DayAgo,
    })
    expect(walletVolumeAmount).not.toBeInstanceOf(Error)
    if (walletVolumeAmount instanceof Error) throw walletVolumeAmount

    const { outgoingBaseAmount: outgoingBase } = walletVolume
    const { outgoingBaseAmount } = walletVolumeAmount
    expect(outgoingBase).toEqual(Number(outgoingBaseAmount.amount))

    const { incomingBaseAmount: incomingBase } = walletVolume
    const { incomingBaseAmount } = walletVolumeAmount
    expect(incomingBase).toEqual(Number(incomingBaseAmount.amount))

    // FIXME: change in code to aggregate outgoing/incoming into single value
    return calc.sub(outgoingBaseAmount, incomingBaseAmount)
  }

  /*
  Txns expected to count:
    - Payment
    - LnFeeReimbursement
    - OnchainPayment
  */
  it("correctly registers withdrawal transactions amount", async () => {
    const outgoingBaseAmountStart = await fetchWithdrawalVolumeAmount(walletDescriptor)

    const getEndAmounts = async (expectedSentAmount) => ({
      actual: await fetchWithdrawalVolumeAmount(walletDescriptor),
      expected: calc.add(outgoingBaseAmountStart, expectedSentAmount),
    })

    let expectedSentAmount: BtcPaymentAmount = ZERO_SATS
    let { actual, expected } = await getEndAmounts(expectedSentAmount)
    expect(expected).toStrictEqual(actual)

    // Payment
    let result = await recordSendLnPayment({
      walletDescriptor,
      paymentAmount: sendAmount,
      bankFee,
    })
    expect(result).not.toBeInstanceOf(Error)
    expectedSentAmount = calc.add(expectedSentAmount, sendAmount.btc)
    ;({ actual, expected } = await getEndAmounts(expectedSentAmount))
    expect(expected).toStrictEqual(actual)

    // OnchainPayment
    result = await recordSendOnChainPayment({
      walletDescriptor,
      paymentAmount: sendAmount,
      bankFee,
    })
    expect(result).not.toBeInstanceOf(Error)
    expectedSentAmount = calc.add(expectedSentAmount, sendAmount.btc)
    ;({ actual, expected } = await getEndAmounts(expectedSentAmount))
    expect(expected).toStrictEqual(actual)
  })

  /* 
  Txns expected to skip:
    - Invoice (LnReceipt)
    - OnchainReceipt
    - IntraLedger (WalletId)
    - LnIntraLedger
    - OnchainIntraLedger

    Admin:
    - Fee
    - Escrow
    - RoutingRevenue
    - ToColdStorage
    - ToHotWallet

    Unused:
    - OnchainDepositFee
    - ExchangeRebalance
    - UserRebalance
*/
  it("correctly ignores all other transaction types", async () => {
    const outgoingBaseAmountStart = await fetchWithdrawalVolumeAmount(walletDescriptor)

    const getEndAmounts = async () => ({
      actual: await fetchWithdrawalVolumeAmount(walletDescriptor),
    })

    let { actual } = await getEndAmounts()
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: move to "included" above
    // LnFeeReimbursement
    let result = await recordLnFeeReimbursement({
      walletDescriptor,
      paymentAmount: bankFee,
      bankFee: zeroAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // Invoice (LnReceipt)
    result = await recordReceiveLnPayment({
      walletDescriptor,
      paymentAmount: receiveAmount,
      bankFee,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // Invoice (OnChainReceipt)
    result = await recordReceiveOnChainPayment({
      walletDescriptor,
      paymentAmount: receiveAmount,
      bankFee,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // WalletId IntraLedger send
    result = await recordWalletIdIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptor,
      recipientWalletDescriptor: walletDescriptorOther,
      paymentAmount: sendAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // WalletId IntraLedger receive
    result = await recordWalletIdIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptorOther,
      recipientWalletDescriptor: walletDescriptor,
      paymentAmount: sendAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // LnIntraledger send
    result = await recordLnIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptor,
      recipientWalletDescriptor: walletDescriptorOther,
      paymentAmount: sendAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // LnIntraledger receive
    result = await recordLnIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptorOther,
      recipientWalletDescriptor: walletDescriptor,
      paymentAmount: receiveAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: OnChain IntraLedger send
    result = await recordOnChainIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptor,
      recipientWalletDescriptor: walletDescriptorOther,
      paymentAmount: sendAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: OnChain IntraLedger receive
    result = await recordOnChainIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptorOther,
      recipientWalletDescriptor: walletDescriptor,
      paymentAmount: receiveAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: Fee
    result = await recordLnChannelOpenOrClosingFee({ fee: toSats(bankFee.btc.amount) })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: Escrow
    result = await recordLndEscrowCredit({ amount: toSats(receiveAmount.btc.amount) })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    result = await recordLndEscrowDebit({ amount: toSats(receiveAmount.btc.amount) })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: RoutingRevenue
    result = await recordLnRoutingRevenue({ amount: toSats(receiveAmount.btc.amount) })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: ToColdStorage
    result = await recordColdStorageTxReceive({
      paymentAmount: receiveAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)

    // TODO: ToHotWallet
    result = await recordColdStorageTxSend({
      paymentAmount: sendAmount,
    })
    expect(result).not.toBeInstanceOf(Error)
    ;({ actual } = await getEndAmounts())
    expect(outgoingBaseAmountStart).toStrictEqual(actual)
  })
})
