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

import { ModifiedSet } from "@utils"

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

const FullLedgerTransactionType = {
  ...LedgerTransactionType,
  IntraLedgerSend: LedgerTransactionType.IntraLedger,
  IntraLedgerReceive: LedgerTransactionType.IntraLedger,
  LnIntraLedgerSend: LedgerTransactionType.LnIntraLedger,
  LnIntraLedgerReceive: LedgerTransactionType.LnIntraLedger,
  OnchainIntraLedgerSend: LedgerTransactionType.OnchainIntraLedger,
  OnchainIntraLedgerReceive: LedgerTransactionType.OnchainIntraLedger,
  EscrowCredit: LedgerTransactionType.Escrow,
  EscrowDebit: LedgerTransactionType.Escrow,
} as const
const {
  IntraLedger,
  LnIntraLedger,
  OnchainIntraLedger,
  Escrow,
  ...ExtendedLedgerTransactionType
} = FullLedgerTransactionType

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
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: sendLimitCalc })),
        testExternalTxReceiveWLE: (args) =>
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: receiveLimitCalc })),
        testInternalTxSendWLE: (args) =>
          it(`send ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: sendLimitCalc,
            })),
        testInternalTxReceiveWLE: (args) =>
          it(`receive ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: receiveLimitCalc,
            })),
      },
      noLimitEffect: {
        testExternalTxNLE: (args) =>
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: noLimitCalc })),
        testInternalTxSendNLE: (args) =>
          it(`send ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: noLimitCalc,
            })),
        testInternalTxReceiveNLE: (args) =>
          it(`receive ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: noLimitCalc,
            })),
      },
    }
  }

  const txTypesForLimits = (
    includedTypes: (keyof typeof ExtendedLedgerTransactionType)[],
  ) => {
    const excludedTypes = Object.keys(ExtendedLedgerTransactionType)
      .map((key) => key as keyof typeof ExtendedLedgerTransactionType)
      .filter(
        (key: keyof typeof ExtendedLedgerTransactionType) => !includedTypes.includes(key),
      )

    it("prepares limit tx types", () => {
      const includedTypesSet = new ModifiedSet(includedTypes)
      const excludedTypesSet = new ModifiedSet(excludedTypes)
      expect(includedTypesSet.intersect(excludedTypesSet).size).toEqual(0)

      // Included here to remove lint for these unused variables
      expect(includedTypes).not.toContain(IntraLedger)
      expect(includedTypes).not.toContain(LnIntraLedger)
      expect(includedTypes).not.toContain(OnchainIntraLedger)
      expect(includedTypes).not.toContain(Escrow)
    })

    return { includedTypes, excludedTypes }
  }

  const executeLimitTests = ({
    includedTxTypes,
    fetchVolumeAmount,
  }: {
    includedTxTypes: (keyof typeof ExtendedLedgerTransactionType)[]
    fetchVolumeAmount
  }) => {
    const { includedTypes, excludedTypes } = txTypesForLimits(includedTxTypes)

    const {
      withLimitEffect: {
        testExternalTxSendWLE,
        testExternalTxReceiveWLE,
        testInternalTxSendWLE,
        testInternalTxReceiveWLE,
      },
      noLimitEffect: {
        testExternalTxNLE,
        testInternalTxSendNLE,
        testInternalTxReceiveNLE,
      },
    } = prepareTxFns(fetchVolumeAmount)

    const txFnsForIncludedTypes = {
      Invoice: () => testExternalTxReceiveWLE({ recordTx: recordReceiveLnPayment }),
      OnchainReceipt: () =>
        testExternalTxReceiveWLE({ recordTx: recordReceiveOnChainPayment }),
      Payment: () => testExternalTxSendWLE({ recordTx: recordSendLnPayment }),
      OnchainPayment: () => testExternalTxSendWLE({ recordTx: recordSendOnChainPayment }),
      LnFeeReimbursement: () =>
        testExternalTxReceiveWLE({
          recordTx: recordLnFeeReimbursement,
        }),
      IntraLedgerSend: () =>
        testInternalTxSendWLE({
          recordTx: recordWalletIdIntraLedgerPayment,
        }),
      IntraLedgerReceive: () =>
        testInternalTxReceiveWLE({
          recordTx: recordWalletIdIntraLedgerPayment,
        }),
      OnchainIntraLedgerSend: () =>
        testInternalTxSendWLE({
          recordTx: recordOnChainIntraLedgerPayment,
        }),
      OnchainIntraLedgerReceive: () =>
        testInternalTxReceiveWLE({
          recordTx: recordOnChainIntraLedgerPayment,
        }),
      LnIntraLedgerSend: () =>
        testInternalTxSendWLE({
          recordTx: recordLnIntraLedgerPayment,
        }),
      LnIntraLedgerReceive: () =>
        testInternalTxReceiveWLE({
          recordTx: recordLnIntraLedgerPayment,
        }),

      // Used, but no limit checks yet:
      // Fee,
      // Escrow,
      // RoutingRevenue,
      // ToColdStorage,
      // ToHotWallet,

      // Not used:
      // ExchangeRebalance,
      // UserRebalance,
      // OnchainDepositFee,
    }

    const txFnsForExcludedTypes = {
      Invoice: () => testExternalTxNLE({ recordTx: recordReceiveLnPayment }),
      OnchainReceipt: () => testExternalTxNLE({ recordTx: recordReceiveOnChainPayment }),
      Payment: () => testExternalTxNLE({ recordTx: recordSendLnPayment }),
      OnchainPayment: () => testExternalTxNLE({ recordTx: recordSendOnChainPayment }),
      LnFeeReimbursement: () => testExternalTxNLE({ recordTx: recordLnFeeReimbursement }),
      Fee: () => testExternalTxNLE({ recordTx: recordLnChannelOpenOrClosingFee }),
      EscrowCredit: () => testExternalTxNLE({ recordTx: recordLndEscrowCredit }),
      EscrowDebit: () => testExternalTxNLE({ recordTx: recordLndEscrowDebit }),
      RoutingRevenue: () => testExternalTxNLE({ recordTx: recordLnRoutingRevenue }),
      ToHotWallet: () => testExternalTxNLE({ recordTx: recordColdStorageTxSend }),
      ToColdStorage: () => testExternalTxNLE({ recordTx: recordColdStorageTxReceive }),
      IntraLedgerSend: () =>
        testInternalTxSendNLE({
          recordTx: recordWalletIdIntraLedgerPayment,
        }),
      IntraLedgerReceive: () =>
        testInternalTxReceiveNLE({
          recordTx: recordWalletIdIntraLedgerPayment,
        }),
      OnchainIntraLedgerSend: () =>
        testInternalTxSendNLE({
          recordTx: recordOnChainIntraLedgerPayment,
        }),
      OnchainIntraLedgerReceive: () =>
        testInternalTxReceiveNLE({
          recordTx: recordOnChainIntraLedgerPayment,
        }),
      LnIntraLedgerSend: () =>
        testInternalTxSendNLE({
          recordTx: recordLnIntraLedgerPayment,
        }),
      LnIntraLedgerReceive: () =>
        testInternalTxReceiveNLE({
          recordTx: recordLnIntraLedgerPayment,
        }),

      // Not used
      ExchangeRebalance: () => undefined,
      UserRebalance: () => undefined,
      OnchainDepositFee: () => undefined,
    }

    // Execute tests for types
    describe("correctly registers transactions amount", () => {
      for (const txType of includedTypes) {
        txFnsForIncludedTypes[txType]()
      }
    })

    describe("correctly ignores all other transaction types", () => {
      for (const txType of excludedTypes) {
        txFnsForExcludedTypes[txType]()
      }
    })
  }

  describe("Withdrawal volumes", () => {
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

    executeLimitTests({
      includedTxTypes: ["Payment", "OnchainPayment"],
      fetchVolumeAmount: fetchWithdrawalVolumeAmount,
    })
  })
})
