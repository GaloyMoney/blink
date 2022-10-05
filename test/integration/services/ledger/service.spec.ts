import crypto from "crypto"

import { ONE_DAY } from "@config"

import {
  AmountCalculator,
  BtcWalletDescriptor,
  UsdWalletDescriptor,
  WalletCurrency,
} from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"

import { LedgerService } from "@services/ledger"

import { ModifiedSet, timestampDaysAgo } from "@utils"

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
  recordWalletIdTradeIntraAccountTxn,
  recordOnChainTradeIntraAccountTxn,
  recordLnTradeIntraAccountTxn,
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

  WalletIdTradeIntraAccountOut: LedgerTransactionType.WalletIdTradeIntraAccount,
  WalletIdTradeIntraAccountIn: LedgerTransactionType.WalletIdTradeIntraAccount,
  LnTradeIntraAccountOut: LedgerTransactionType.LnTradeIntraAccount,
  LnTradeIntraAccountIn: LedgerTransactionType.LnTradeIntraAccount,
  OnChainTradeIntraAccountOut: LedgerTransactionType.OnChainTradeIntraAccount,
  OnChainTradeIntraAccountIn: LedgerTransactionType.OnChainTradeIntraAccount,

  EscrowCredit: LedgerTransactionType.Escrow,
  EscrowDebit: LedgerTransactionType.Escrow,
} as const

const {
  IntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
  LnIntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
  OnchainIntraLedger, // eslint-disable-line @typescript-eslint/no-unused-vars
  WalletIdTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
  LnTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
  OnChainTradeIntraAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
  Escrow, // eslint-disable-line @typescript-eslint/no-unused-vars

  ...ExtendedLedgerTransactionType
} = FullLedgerTransactionType

const {
  Fee, // eslint-disable-line @typescript-eslint/no-unused-vars
  RoutingRevenue, // eslint-disable-line @typescript-eslint/no-unused-vars
  ToColdStorage, // eslint-disable-line @typescript-eslint/no-unused-vars
  ToHotWallet, // eslint-disable-line @typescript-eslint/no-unused-vars
  EscrowCredit, // eslint-disable-line @typescript-eslint/no-unused-vars
  EscrowDebit, // eslint-disable-line @typescript-eslint/no-unused-vars

  ...UserLedgerTransactionType
} = ExtendedLedgerTransactionType

describe("Volumes", () => {
  const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
  if (timestamp1DayAgo instanceof Error) return timestamp1DayAgo

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

  // Each "TxFn" execute a transaction for a given type and then checks if
  // the respective tx volume has been affected or not.
  const prepareTxFns = <S extends WalletCurrency>(
    fetchVolumeAmount: fetchVolumeAmountType<S>,
  ) => {
    // Base function for extra-ledger transactions (onchain/ln)
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

    // Base function for intra-ledger transactions
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

    const sendVolumeCalc = calc.add
    const receiveVolumeCalc = calc.sub
    const noVolumeCalc = (a) => a

    return {
      withVolumeEffect: {
        testExternalTxSendWLE: (args) =>
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: sendVolumeCalc })),
        testExternalTxReceiveWLE: (args) =>
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: receiveVolumeCalc })),
        testInternalTxSendWLE: (args) =>
          it(`send ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: sendVolumeCalc,
            })),
        testInternalTxReceiveWLE: (args) =>
          it(`receive ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: receiveVolumeCalc,
            })),
      },
      noVolumeEffect: {
        testExternalTxNLE: (args) =>
          it(`${args.recordTx.name}`, async () =>
            testExternalTx({ ...args, calcFn: noVolumeCalc })),
        testInternalTxSendNLE: (args) =>
          it(`send ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptor,
              recipient: walletDescriptorOther,
              calcFn: noVolumeCalc,
            })),
        testInternalTxReceiveNLE: (args) =>
          it(`receive ${args.recordTx.name}`, async () =>
            testInternalTx({
              ...args,
              sender: walletDescriptorOther,
              recipient: walletDescriptor,
              calcFn: noVolumeCalc,
            })),
      },
    }
  }

  const txTypesForVolumes = (
    includedTypes: (keyof typeof ExtendedLedgerTransactionType)[],
  ) => {
    const excludedTypes = Object.keys(ExtendedLedgerTransactionType)
      .map((key) => key as keyof typeof ExtendedLedgerTransactionType)
      .filter(
        (key: keyof typeof ExtendedLedgerTransactionType) => !includedTypes.includes(key),
      )

    it("prepares volume tx types", () => {
      const includedTypesSet = new ModifiedSet(includedTypes)
      const excludedTypesSet = new ModifiedSet(excludedTypes)
      expect(includedTypesSet.intersect(excludedTypesSet).size).toEqual(0)
    })

    return { includedTypes, excludedTypes }
  }

  // Used to manage how 'outgoing'/'incoming' from volumes is applied
  const VolumeType = {
    Out: "out",
    NetOut: "netOut",
    In: "in",
  } as const

  // Used to construct the 'fetchVolumeAmount' fn for a specific volume type
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

  // Executes the tests for each 'describe' for volume types below
  const executeVolumeTests = <S extends WalletCurrency>({
    includedTxTypes,
    fetchVolumeAmount,
  }: {
    includedTxTypes: (keyof typeof UserLedgerTransactionType)[]
    fetchVolumeAmount: fetchVolumeAmountType<S>
  }) => {
    const { includedTypes, excludedTypes } = txTypesForVolumes(includedTxTypes)

    const {
      withVolumeEffect: {
        testExternalTxSendWLE,
        testExternalTxReceiveWLE,
        testInternalTxSendWLE,
        testInternalTxReceiveWLE,
      },
      noVolumeEffect: {
        testExternalTxNLE,
        testInternalTxSendNLE,
        testInternalTxReceiveNLE,
      },
    } = prepareTxFns(fetchVolumeAmount)

    // Setting up all 'it' tests for each txn type, to check volume is affected
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
      WalletIdTradeIntraAccountOut: () =>
        testInternalTxSendWLE({
          recordTx: recordWalletIdTradeIntraAccountTxn,
        }),
      LnTradeIntraAccountOut: () =>
        testInternalTxSendWLE({
          recordTx: recordLnTradeIntraAccountTxn,
        }),
      OnChainTradeIntraAccountOut: () =>
        testInternalTxSendWLE({
          recordTx: recordOnChainTradeIntraAccountTxn,
        }),
      WalletIdTradeIntraAccountIn: () =>
        testInternalTxReceiveWLE({
          recordTx: recordWalletIdTradeIntraAccountTxn,
        }),
      LnTradeIntraAccountIn: () =>
        testInternalTxReceiveWLE({
          recordTx: recordLnTradeIntraAccountTxn,
        }),
      OnChainTradeIntraAccountIn: () =>
        testInternalTxReceiveWLE({
          recordTx: recordOnChainTradeIntraAccountTxn,
        }),

      // Used, but no volume checks yet:
      Fee: () => testExternalTxSendWLE({ recordTx: recordLnChannelOpenOrClosingFee }),
      EscrowCredit: () => testExternalTxSendWLE({ recordTx: recordLndEscrowCredit }),
      EscrowDebit: () => testExternalTxSendWLE({ recordTx: recordLndEscrowDebit }),
      RoutingRevenue: () => testExternalTxSendWLE({ recordTx: recordLnRoutingRevenue }),
      ToHotWallet: () => testExternalTxSendWLE({ recordTx: recordColdStorageTxSend }),
      ToColdStorage: () =>
        testExternalTxSendWLE({ recordTx: recordColdStorageTxReceive }),
    }

    // Setting up all 'it' tests for each txn type, to check volume is NOT affected
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
      WalletIdTradeIntraAccountOut: () =>
        testInternalTxSendNLE({
          recordTx: recordWalletIdTradeIntraAccountTxn,
        }),
      LnTradeIntraAccountOut: () =>
        testInternalTxSendNLE({
          recordTx: recordLnTradeIntraAccountTxn,
        }),
      OnChainTradeIntraAccountOut: () =>
        testInternalTxSendNLE({
          recordTx: recordOnChainTradeIntraAccountTxn,
        }),
      WalletIdTradeIntraAccountIn: () =>
        testInternalTxReceiveNLE({
          recordTx: recordWalletIdTradeIntraAccountTxn,
        }),
      LnTradeIntraAccountIn: () =>
        testInternalTxReceiveNLE({
          recordTx: recordLnTradeIntraAccountTxn,
        }),
      OnChainTradeIntraAccountIn: () =>
        testInternalTxReceiveNLE({
          recordTx: recordOnChainTradeIntraAccountTxn,
        }),
    }

    // Execute tests for specific types included
    describe("correctly registers transactions amount", () => {
      for (const txType of includedTypes) {
        expect(Object.keys(txFnsForIncludedTypes)).toContain(txType)
        txFnsForIncludedTypes[txType]()
      }
    })

    // Execute tests for rest of types excluded
    describe("correctly ignores all other transaction types", () => {
      for (const txType of excludedTypes) {
        expect(Object.keys(txFnsForExcludedTypes)).toContain(txType)
        txFnsForExcludedTypes[txType]()
      }
    })
  }

  // EXECUTE TESTS FOR EACH VOLUME TYPE
  // ==========

  describe("All payment volumes", () => {
    executeVolumeTests({
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
    executeVolumeTests({
      includedTxTypes: ["Payment", "OnchainPayment"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.externalPaymentVolumeSince,
        volumeAmountFn: ledgerService.externalPaymentVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("Internal payment volumes", () => {
    executeVolumeTests({
      includedTxTypes: ["IntraLedgerSend", "OnchainIntraLedgerSend", "LnIntraLedgerSend"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.intraledgerTxBaseVolumeSince,
        volumeAmountFn: ledgerService.intraledgerTxBaseVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("Intra-account trade volumes", () => {
    executeVolumeTests({
      // Note: Including '...In' types as well would double-count volumes
      includedTxTypes: [
        "WalletIdTradeIntraAccountOut",
        "OnChainTradeIntraAccountOut",
        "LnTradeIntraAccountOut",
      ],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.tradeIntraAccountTxBaseVolumeSince,
        volumeAmountFn: ledgerService.tradeIntraAccountTxBaseVolumeAmountSince,
        volumeType: VolumeType.Out,
      }),
    })
  })

  describe("All activity", () => {
    const includedTxTypes = Object.keys(
      UserLedgerTransactionType,
    ) as (keyof typeof UserLedgerTransactionType)[]

    executeVolumeTests({
      includedTxTypes,
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.allTxBaseVolumeSince,
        volumeAmountFn: ledgerService.allTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })

  describe("All onchain activity", () => {
    executeVolumeTests({
      includedTxTypes: ["OnchainPayment", "OnchainReceipt"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.onChainTxBaseVolumeSince,
        volumeAmountFn: ledgerService.onChainTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })

  describe("All ln activity", () => {
    executeVolumeTests({
      includedTxTypes: ["Payment", "Invoice", "LnFeeReimbursement"],
      fetchVolumeAmount: getFetchVolumeAmountFn({
        volumeFn: ledgerService.lightningTxBaseVolumeSince,
        volumeAmountFn: ledgerService.lightningTxBaseVolumeAmountSince,
        volumeType: VolumeType.NetOut,
      }),
    })
  })
})
