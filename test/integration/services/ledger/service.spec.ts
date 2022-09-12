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

  const prepareTxFns = (fetchVolumeAmount) => {
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

    const sendLimitCalc = calc.add
    const receiveLimitCalc = calc.sub
    const noLimitCalc = (a) => a

    return {
      withLimitEffect: {
        testExternalTxSendWLE: (args) =>
          it(`testExternalTxSendWLE: ${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: sendLimitCalc })),
        testExternalTxReceiveWLE: (args) =>
          it(`testExternalTxReceiveWLE: ${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: receiveLimitCalc })),
        testInternalTxSendWLE: (args) =>
          it(`testInternalTxSendWLE: ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: sendLimitCalc,
            })),
        testInternalTxReceiveWLE: (args) =>
          it(`testInternalTxReceiveWLE: ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: receiveLimitCalc,
            })),
      },
      noLimitEffect: {
        testExternalTxNLE: (args) =>
          it(`testExternalTxNLE: ${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: noLimitCalc })),
        testInternalTxSendNLE: (args) =>
          it(`testInternalTxSendNLE: ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: noLimitCalc,
            })),
        testInternalTxReceiveNLE: (args) =>
          it(`testInternalTxReceiveNLE: ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: noLimitCalc,
            })),
      },
    }
  }

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
      withLimitEffect: { testExternalTxSendWLE },
      noLimitEffect: {
        testExternalTxNLE,
        testInternalTxSendNLE,
        testInternalTxReceiveNLE,
      },
    } = prepareTxFns(fetchWithdrawalVolumeAmount)

    /*
    Txns expected to count:
      - Payment
      - LnFeeReimbursement
      - OnchainPayment
    */
    describe("correctly registers withdrawal transactions amount", () => {
      // Payment
      testExternalTxSendWLE({
        recordTx: recordSendLnPayment,
      })

      // OnchainPayment
      testExternalTxSendWLE({
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
      testExternalTxNLE({ recordTx: recordLnFeeReimbursement })

      // Invoice (LnReceipt)
      testExternalTxNLE({ recordTx: recordReceiveLnPayment })

      // Invoice (OnChainReceipt)
      testExternalTxNLE({ recordTx: recordReceiveOnChainPayment })

      // WalletId IntraLedger send
      testInternalTxSendNLE({ recordTx: recordWalletIdIntraLedgerPayment })

      // WalletId IntraLedger receive
      testInternalTxReceiveNLE({ recordTx: recordWalletIdIntraLedgerPayment })

      // LnIntraledger send
      testInternalTxSendNLE({ recordTx: recordLnIntraLedgerPayment })

      // LnIntraledger receive
      testInternalTxReceiveNLE({ recordTx: recordLnIntraLedgerPayment })

      // OnChain IntraLedger send
      testInternalTxSendNLE({ recordTx: recordOnChainIntraLedgerPayment })

      // OnChain IntraLedger receive
      testInternalTxReceiveNLE({ recordTx: recordOnChainIntraLedgerPayment })

      // Fee
      testExternalTxNLE({ recordTx: recordLnChannelOpenOrClosingFee })

      // Escrow
      testExternalTxNLE({ recordTx: recordLndEscrowCredit })

      testExternalTxNLE({ recordTx: recordLndEscrowDebit })

      // RoutingRevenue
      testExternalTxNLE({ recordTx: recordLnRoutingRevenue })

      // ToColdStorage
      testExternalTxNLE({ recordTx: recordColdStorageTxReceive })

      // ToHotWallet
      testExternalTxNLE({ recordTx: recordColdStorageTxSend })
    })
  })
})
