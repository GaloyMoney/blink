import crypto from "crypto"

import { MS_PER_DAY } from "@config"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
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

  const paymentAmount = {
    usd: { amount: 200n, currency: WalletCurrency.Usd },
    btc: { amount: 400n, currency: WalletCurrency.Btc },
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

  // Setup external txns tests
  const testExternalTx = async ({ recordTx, calcFn }) => {
    const currentVolumeAmount = await fetchWithdrawalVolumeAmount(walletDescriptor)
    const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

    const result = await recordTx({
      walletDescriptor,
      paymentAmount,
      bankFee,
    })
    expect(result).not.toBeInstanceOf(Error)

    const actual = await fetchWithdrawalVolumeAmount(walletDescriptor)
    expect(expected).toStrictEqual(actual)
  }
  const testExternalTxSend = async (args) => testExternalTx({ ...args, calcFn: calc.add })
  const testExternalTxReceive = async (args) =>
    testExternalTx({ ...args, calcFn: calc.sub })
  const testExternalTxNoOp = async (args) => testExternalTx({ ...args, calcFn: (a) => a })

  // Setup internal txns tests
  const testInternalTx = async ({ recordTx, sender, recipient, calcFn }) => {
    const currentVolumeAmount = await fetchWithdrawalVolumeAmount(walletDescriptor)
    const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

    const result = await recordTx({
      senderWalletDescriptor: sender,
      recipientWalletDescriptor: recipient,
      paymentAmount,
    })
    expect(result).not.toBeInstanceOf(Error)

    const actual = await fetchWithdrawalVolumeAmount(walletDescriptor)
    expect(expected).toStrictEqual(actual)
  }
  const testInternalTxSend = async (args) =>
    testInternalTx({
      ...args,
      sender: walletDescriptor,
      recipient: walletDescriptorOther,
      calcFn: calc.add,
    })
  const testInternalTxReceive = async (args) =>
    testInternalTx({
      ...args,
      sender: walletDescriptorOther,
      recipient: walletDescriptor,
      calcFn: calc.sub,
    })
  const testInternalTxSendNoOp = async (args) =>
    testInternalTx({
      ...args,
      sender: walletDescriptor,
      recipient: walletDescriptorOther,
      calcFn: (a) => a,
    })
  const testInternalTxReceiveNoOp = async (args) =>
    testInternalTx({
      ...args,
      sender: walletDescriptorOther,
      recipient: walletDescriptor,
      calcFn: (a) => a,
    })

  // Setup no-facade txns tests
  const testTxWithoutFacade = async ({ recordTx, calcFn }) => {
    const currentVolumeAmount = await fetchWithdrawalVolumeAmount(walletDescriptor)
    const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

    const result = await recordTx({ amount: toSats(paymentAmount.btc.amount) })
    expect(result).not.toBeInstanceOf(Error)

    const actual = await fetchWithdrawalVolumeAmount(walletDescriptor)
    expect(expected).toStrictEqual(actual)
  }
  const testTxWithoutFacadeNoOp = async (args) =>
    testTxWithoutFacade({ ...args, calcFn: (a) => a })

  /*
  Txns expected to count:
    - Payment
    - LnFeeReimbursement
    - OnchainPayment
  */
  it("correctly registers withdrawal transactions amount", async () => {
    // Payment
    await testExternalTxSend({
      recordTx: recordSendLnPayment,
    })

    // OnchainPayment
    await testExternalTxSend({
      recordTx: recordSendOnChainPayment,
    })
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
    // TODO: move to "included" above
    // LnFeeReimbursement
    await testExternalTxNoOp({ recordTx: recordLnFeeReimbursement })

    // Invoice (LnReceipt)
    await testExternalTxNoOp({ recordTx: recordReceiveLnPayment })

    // Invoice (OnChainReceipt)
    await testExternalTxNoOp({ recordTx: recordReceiveOnChainPayment })

    // WalletId IntraLedger send
    await testInternalTxSendNoOp({ recordTx: recordWalletIdIntraLedgerPayment })

    // WalletId IntraLedger receive
    await testInternalTxReceiveNoOp({ recordTx: recordWalletIdIntraLedgerPayment })

    // LnIntraledger send
    await testInternalTxSendNoOp({ recordTx: recordLnIntraLedgerPayment })

    // LnIntraledger receive
    await testInternalTxReceiveNoOp({ recordTx: recordLnIntraLedgerPayment })

    // OnChain IntraLedger send
    await testInternalTxSendNoOp({ recordTx: recordOnChainIntraLedgerPayment })

    // OnChain IntraLedger receive
    await testInternalTxReceiveNoOp({ recordTx: recordOnChainIntraLedgerPayment })

    // Fee
    testTxWithoutFacadeNoOp({ recordTx: recordLnChannelOpenOrClosingFee })

    // Escrow
    testTxWithoutFacadeNoOp({ recordTx: recordLndEscrowCredit })

    testTxWithoutFacadeNoOp({ recordTx: recordLndEscrowDebit })

    // RoutingRevenue
    testTxWithoutFacadeNoOp({ recordTx: recordLnRoutingRevenue })

    // ToColdStorage
    await testExternalTxNoOp({ recordTx: recordColdStorageTxReceive })

    // ToHotWallet
    await testExternalTxNoOp({ recordTx: recordColdStorageTxSend })
  })
})
