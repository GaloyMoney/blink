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

  type fetchVolumeAmountType<S extends WalletCurrency> = (
    walletDescriptor: WalletDescriptor<S>,
  ) => Promise<PaymentAmount<S>>

  const prepareTxFns = <S extends WalletCurrency>(
    fetchVolumeAmount: fetchVolumeAmountType<S>,
  ) => {
    const testExternalTx = async ({
      recordTx,
      calcFn,
    }: {
      recordTx
      calcFn: <S extends WalletCurrency>(a, b) => PaymentAmount<S>
    }) => {
      const currentVolumeAmount = await fetchVolumeAmount(
        walletDescriptor as WalletDescriptor<S>,
      )
      if (currentVolumeAmount instanceof Error) throw currentVolumeAmount
      const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

      const result = await recordTx({
        walletDescriptor,
        paymentAmount,
        bankFee,
      })
      expect(result).not.toBeInstanceOf(Error)

      const actual = await fetchVolumeAmount(walletDescriptor as WalletDescriptor<S>)
      expect(expected).toStrictEqual(actual)
    }

    const testInternalTx = async ({ recordTx, sender, recipient, calcFn }) => {
      const currentVolumeAmount = await fetchVolumeAmount(
        walletDescriptor as WalletDescriptor<S>,
      )
      const expected = calcFn(currentVolumeAmount, paymentAmount.btc)

      const result = await recordTx({
        senderWalletDescriptor: sender,
        recipientWalletDescriptor: recipient,
        paymentAmount,
      })
      expect(result).not.toBeInstanceOf(Error)

      const actual = await fetchVolumeAmount(walletDescriptor as WalletDescriptor<S>)
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

  const executeLimitTests = <S extends WalletCurrency>({
    includedTxTypes,
    fetchVolumeAmount,
  }: {
    includedTxTypes: (keyof typeof ExtendedLedgerTransactionType)[]
    fetchVolumeAmount: fetchVolumeAmountType<S>
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
      Fee: () => testExternalTxSendWLE({ recordTx: recordLnChannelOpenOrClosingFee }),
      EscrowCredit: () => testExternalTxSendWLE({ recordTx: recordLndEscrowCredit }),
      EscrowDebit: () => testExternalTxSendWLE({ recordTx: recordLndEscrowDebit }),
      RoutingRevenue: () => testExternalTxSendWLE({ recordTx: recordLnRoutingRevenue }),
      ToHotWallet: () => testExternalTxSendWLE({ recordTx: recordColdStorageTxSend }),
      ToColdStorage: () =>
        testExternalTxSendWLE({ recordTx: recordColdStorageTxReceive }),

      // Not used:
      ExchangeRebalance: () => undefined,
      UserRebalance: () => undefined,
      OnchainDepositFee: () => undefined,
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

  const VolumeType = {
    Out: "out",
    NetOut: "netOut",
    In: "in",
  } as const

  const getFetchVolumeAmountFn = <S extends WalletCurrency>({
    volumeFn,
    volumeAmountFn,
    volumeType,
  }: {
    volumeFn: GetVolumeSinceFn
    volumeAmountFn: GetVolumeAmountSinceFn
    volumeType
  }): fetchVolumeAmountType<S> => {
    const fetchVolumeAmountFn: fetchVolumeAmountType<S> = async (
      walletDescriptor: WalletDescriptor<S>,
    ): Promise<PaymentAmount<S>> => {
      const walletVolume = await volumeFn({
        walletId: walletDescriptor.id,
        timestamp: timestamp1DayAgo,
      })
      expect(walletVolume).not.toBeInstanceOf(Error)
      if (walletVolume instanceof Error) throw walletVolume

      const walletVolumeAmount = await volumeAmountFn({
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

      // FIXME: change in code to couple this method to actual implementation
      // return calc.sub(outgoingBaseAmount, incomingBaseAmount)

      switch (volumeType) {
        case VolumeType.Out:
          return walletVolumeAmount.outgoingBaseAmount
        case VolumeType.In:
          return walletVolumeAmount.incomingBaseAmount
        case VolumeType.NetOut:
          return calc.sub(
            walletVolumeAmount.outgoingBaseAmount,
            walletVolumeAmount.incomingBaseAmount,
          )
        default:
          throw new Error("Invalid 'volumeType' arg")
      }
    }

    return fetchVolumeAmountFn
  }

  describe("All payment volumes", () => {
    executeLimitTests({
      includedTxTypes: [
        "Payment",
        "OnchainPayment",
        "IntraLedgerSend",
        "OnchainIntraLedgerSend",
        "LnIntraLedgerSend",
      ],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.allPaymentVolumeSince,
        volumeAmountFn: ledgerService.allPaymentVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("External payment (withdrawal) volumes", () => {
    executeLimitTests({
      includedTxTypes: ["Payment", "OnchainPayment"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.externalPaymentVolumeSince,
        volumeAmountFn: ledgerService.externalPaymentVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("Internal payment volumes", () => {
    executeLimitTests({
      includedTxTypes: ["IntraLedgerSend", "OnchainIntraLedgerSend", "LnIntraLedgerSend"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.intraledgerTxBaseVolumeSince,
        volumeAmountFn: ledgerService.intraledgerTxBaseVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("All activity", () => {
    // FIXME: Should be all tx types, why are these not included?
    const {
      Fee,
      RoutingRevenue,
      ToColdStorage,
      ToHotWallet,
      EscrowCredit,
      EscrowDebit,
      ...includedTypesObj
    } = ExtendedLedgerTransactionType
    const includedTxTypes = Object.keys(
      includedTypesObj,
    ) as (keyof typeof ExtendedLedgerTransactionType)[]

    const others = [
      Fee,
      RoutingRevenue,
      ToColdStorage,
      ToHotWallet,
      EscrowCredit,
      EscrowDebit,
    ]
    expect(
      new ModifiedSet(others).intersect(new ModifiedSet(includedTxTypes)).size,
    ).toEqual(0)

    executeLimitTests({
      includedTxTypes,
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.allTxBaseVolumeSince,
        volumeAmountFn: ledgerService.allTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })

  describe("All onchain activity", () => {
    executeLimitTests({
      includedTxTypes: ["OnchainPayment", "OnchainReceipt"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.onChainTxBaseVolumeSince,
        volumeAmountFn: ledgerService.onChainTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })

  describe("All ln activity", () => {
    executeLimitTests({
      includedTxTypes: ["Payment", "Invoice", "LnFeeReimbursement"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.lightningTxBaseVolumeSince,
        volumeAmountFn: ledgerService.lightningTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })
})
