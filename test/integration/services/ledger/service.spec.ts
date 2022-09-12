import crypto from "crypto"

import { MS_PER_DAY } from "@config"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
} from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"

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

describe("Volumes", () => {
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

  const prepareExternalTxFns = (fetchVolumeAmount) => {
    // Setup external txns tests
    const testExternalTx = async ({ recordTx, calcFn }) => {
      const currentVolumeAmount = await fetchVolumeAmount(walletDescriptor)
      const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

      const result = await recordTx({
        walletDescriptor,
        paymentAmount,
        bankFee,
      })
      expect(result).not.toBeInstanceOf(Error)

      const actual = await fetchVolumeAmount(walletDescriptor)
      expect(expected).toStrictEqual(actual)
    }

    return {
      testExternalTxSend: (args) =>
        it(`testExternalSend: ${args.recordTx.name}`, async () =>
          testExternalTx({ ...args, calcFn: calc.add })),
      testExternalTxReceive: (args) =>
        it(`testExternalTxReceive: ${args.recordTx.name}`, async () =>
          testExternalTx({ ...args, calcFn: calc.sub })),
      testExternalTxNoOp: (args) =>
        it(`testExternalTxNoOp: ${args.recordTx.name}`, async () =>
          testExternalTx({ ...args, calcFn: (a) => a })),
    }
  }

  const prepareInternalTxFns = (fetchVolumeAmount) => {
    // Setup internal txns tests
    const testInternalTx = async ({ recordTx, sender, recipient, calcFn }) => {
      const currentVolumeAmount = await fetchVolumeAmount(walletDescriptor)
      const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

      const result = await recordTx({
        senderWalletDescriptor: sender,
        recipientWalletDescriptor: recipient,
        paymentAmount,
      })
      expect(result).not.toBeInstanceOf(Error)

      const actual = await fetchVolumeAmount(walletDescriptor)
      expect(expected).toStrictEqual(actual)
    }

    return {
      testInternalTxSend: (args) =>
        it(`testInternalTxSend: ${args.recordTx.name}`, async () =>
          testInternalTx({
            ...args,
            sender: walletDescriptor,
            recipient: walletDescriptorOther,
            calcFn: calc.add,
          })),
      testInternalTxReceive: (args) =>
        it(`testInternalTxReceive: ${args.recordTx.name}`, async () =>
          testInternalTx({
            ...args,
            sender: walletDescriptorOther,
            recipient: walletDescriptor,
            calcFn: calc.sub,
          })),
      testInternalTxSendNoOp: (args) =>
        it(`testInternalTxSendNoOp: ${args.recordTx.name}`, async () =>
          testInternalTx({
            ...args,
            sender: walletDescriptor,
            recipient: walletDescriptorOther,
            calcFn: (a) => a,
          })),
      testInternalTxReceiveNoOp: (args) =>
        it(`testInternalTxReceiveNoOp: ${args.recordTx.name}`, async () =>
          testInternalTx({
            ...args,
            sender: walletDescriptorOther,
            recipient: walletDescriptor,
            calcFn: (a) => a,
          })),
    }
  }

  const prepareTxFns = (fetchVolumeAmount) => ({
    ...prepareExternalTxFns(fetchVolumeAmount),
    ...prepareInternalTxFns(fetchVolumeAmount),
  })

  describe("Withdrawal volumes", () => {
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

    const {
      testExternalTxSend,
      testExternalTxNoOp,
      testInternalTxSendNoOp,
      testInternalTxReceiveNoOp,
    } = prepareTxFns(fetchWithdrawalVolumeAmount)

    /*
    Txns expected to count:
      - Payment
      - LnFeeReimbursement
      - OnchainPayment
    */
    describe("correctly registers withdrawal transactions amount", () => {
      // Payment
      testExternalTxSend({
        recordTx: recordSendLnPayment,
      })

      // OnchainPayment
      testExternalTxSend({
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
    describe("correctly ignores all other transaction types", () => {
      // TODO: move to "included" above
      // LnFeeReimbursement
      testExternalTxNoOp({ recordTx: recordLnFeeReimbursement })

      // Invoice (LnReceipt)
      testExternalTxNoOp({ recordTx: recordReceiveLnPayment })

      // Invoice (OnChainReceipt)
      testExternalTxNoOp({ recordTx: recordReceiveOnChainPayment })

      // WalletId IntraLedger send
      testInternalTxSendNoOp({ recordTx: recordWalletIdIntraLedgerPayment })

      // WalletId IntraLedger receive
      testInternalTxReceiveNoOp({ recordTx: recordWalletIdIntraLedgerPayment })

      // LnIntraledger send
      testInternalTxSendNoOp({ recordTx: recordLnIntraLedgerPayment })

      // LnIntraledger receive
      testInternalTxReceiveNoOp({ recordTx: recordLnIntraLedgerPayment })

      // OnChain IntraLedger send
      testInternalTxSendNoOp({ recordTx: recordOnChainIntraLedgerPayment })

      // OnChain IntraLedger receive
      testInternalTxReceiveNoOp({ recordTx: recordOnChainIntraLedgerPayment })

      // Fee
      testExternalTxNoOp({ recordTx: recordLnChannelOpenOrClosingFee })

      // Escrow
      testExternalTxNoOp({ recordTx: recordLndEscrowCredit })

      testExternalTxNoOp({ recordTx: recordLndEscrowDebit })

      // RoutingRevenue
      testExternalTxNoOp({ recordTx: recordLnRoutingRevenue })

      // ToColdStorage
      testExternalTxNoOp({ recordTx: recordColdStorageTxReceive })

      // ToHotWallet
      testExternalTxNoOp({ recordTx: recordColdStorageTxSend })
    })
  })
})
