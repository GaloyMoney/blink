import crypto from "crypto"

import mongoose from "mongoose"

import { generateHash } from "./generate-hash"

import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@/domain/shared"
import { toSats } from "@/domain/bitcoin"
import { LedgerTransactionType, toLiabilitiesWalletId } from "@/domain/ledger"

import { toObjectId } from "@/services/mongoose/utils"
import { MainBook } from "@/services/ledger/books"
import { translateToLedgerJournal } from "@/services/ledger"
import { getBankOwnerWalletId } from "@/services/ledger/caching"
import {
  coldStorageAccountId,
  escrowAccountId,
  lndLedgerAccountId,
} from "@/services/ledger/domain"
import * as LedgerFacade from "@/services/ledger/facade"

const Journal = mongoose.models.Medici_Journal
const Transaction = mongoose.models.Medici_Transaction

export const markFailedTransactionAsPending = async (id: LedgerJournalId) => {
  const journalIdAsObject = toObjectId<LedgerJournalId>(id)

  // Step 1: Fetch transaction and confirm voided
  // ===
  const { results: journalTxns } = await MainBook.ledger({
    _journal: journalIdAsObject,
  })
  if (!(journalTxns && journalTxns.length > 0)) {
    throw new Error("No transactions found for journalId")
  }
  expect(journalTxns[0]).toHaveProperty("voided")
  expect(journalTxns[0]).toHaveProperty("void_reason")

  // Step 2: Fetch canceling transactions by "original_journal"
  // ===
  const { results: cancelJournalTxns } = await MainBook.ledger({
    _original_journal: journalIdAsObject,
  })
  if (!(cancelJournalTxns && cancelJournalTxns.length > 0)) {
    throw new Error("No canceled counter-transactions found")
  }
  const voidJournalIdAsObject = cancelJournalTxns[0]._journal

  // Step 3: Get original journal Id and delete journal + entries
  // ===
  await Transaction.deleteMany({
    _journal: voidJournalIdAsObject,
  })

  await Journal.deleteOne({
    _id: voidJournalIdAsObject,
  })

  // Step 4: Remove voided status from original txns/journal, and mark original txns as pending
  // ===
  await Transaction.updateMany(
    { _journal: journalIdAsObject },
    { pending: true, $unset: { voided: 1, void_reason: 1 } },
  )

  await Journal.updateMany(
    { _id: journalIdAsObject },
    { $unset: { voided: 1, void_reason: 1 } },
  )
}

export const markSuccessfulTransactionAsPending = async (id: LedgerJournalId) => {
  const journalIdAsObject = toObjectId<LedgerJournalId>(id)

  // Step 1: Fetch transaction and confirm not voided
  const { results: journalTxns } = await MainBook.ledger({
    _journal: journalIdAsObject,
  })
  if (!(journalTxns && journalTxns.length > 0)) {
    throw new Error("No transactions found for journalId")
  }
  expect(journalTxns[0]).not.toHaveProperty("voided")
  expect(journalTxns[0]).not.toHaveProperty("void_reason")

  // Step 2: Mark original txns as pending
  await Transaction.updateMany({ _journal: journalIdAsObject }, { pending: true })
}

export const recordReceiveLnPayment = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
  memo,
}: RecordExternalTxTestArgs<S>) => {
  const paymentHash = generateHash() as PaymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnReceiveLedgerMetadata({
    paymentHash,
    pubkey: crypto.randomUUID() as Pubkey,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },

    ...displayAmounts,
  })

  return LedgerFacade.recordReceiveOffChain({
    description: memo || "receives bitcoin via ln",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    txMetadata: { hash: paymentHash },
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordReceiveOnChainPayment = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => {
  const onChainTxHash = crypto.randomUUID() as OnChainTxHash
  const newAddressRequestId = crypto.randomUUID() as OnChainAddressRequestId
  const onChainTxVout = 0 as OnChainTxVout

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.OnChainReceiveLedgerMetadata({
    onChainTxHash,
    onChainTxVout,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },

    ...displayAmounts,

    payeeAddresses: ["address1" as OnChainAddress],
    newAddressRequestId,
  })

  return LedgerFacade.recordReceiveOnChain({
    description: "receives bitcoin via onchain",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordSendLnPayment = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => {
  const paymentHash = crypto.randomUUID() as PaymentHash
  const { metadata, debitAccountAdditionalMetadata, internalAccountsAdditionalMetadata } =
    LedgerFacade.LnSendLedgerMetadata({
      paymentHash,
      pubkey: crypto.randomUUID() as Pubkey,
      feeKnownInAdvance: true,
      paymentAmounts: {
        btcPaymentAmount: paymentAmount.btc,
        usdPaymentAmount: paymentAmount.usd,
        btcProtocolAndBankFee: bankFee.btc,
        usdProtocolAndBankFee: bankFee.usd,
      },

      ...displayAmounts,
    })

  const recorded = await LedgerFacade.recordSendOffChain({
    description: "sends bitcoin via ln",
    amountToDebitSender: paymentAmount,
    senderWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalDebitMetadata: debitAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
  if (recorded instanceof Error) throw recorded

  return {
    ...recorded,
    paymentHash,
  }
}

export const recordSendOnChainPayment = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => {
  const { metadata, debitAccountAdditionalMetadata, internalAccountsAdditionalMetadata } =
    LedgerFacade.OnChainSendLedgerMetadata({
      paymentAmounts: {
        btcPaymentAmount: paymentAmount.btc,
        usdPaymentAmount: paymentAmount.usd,
        btcProtocolAndBankFee: bankFee.btc,
        usdProtocolAndBankFee: bankFee.usd,
      },

      ...displayAmounts,

      payeeAddresses: ["address1" as OnChainAddress],
      sendAll: false,
    })

  return LedgerFacade.recordSendOnChain({
    description: "sends bitcoin via onchain",
    amountToDebitSender: paymentAmount,
    senderWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalDebitMetadata: debitAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordLnFeeReimbursement = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnFeeReimbursementReceiveLedgerMetadata({
    paymentHash,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },
    journalId: "031a419636dbf6d25981d6d2" as LedgerJournalId,

    ...displayAmounts,
  })

  return LedgerFacade.recordReceiveOffChain({
    description: "receives ln fee reimburse",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    txMetadata: { hash: paymentHash },
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordLnFailedPayment = async <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnFailedPaymentReceiveLedgerMetadata({
    paymentHash,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },
    journalId: "031a419636dbf6d25981d6d2" as LedgerJournalId,

    ...displayAmounts,
  })

  return LedgerFacade.recordReceiveOffChain({
    description: "receives ln fee reimburse",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    txMetadata: { hash: paymentHash },
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordLnIntraLedgerPayment: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
  recipientDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.LnIntraledgerLedgerMetadata({
    paymentHash: crypto.randomUUID() as PaymentHash,

    ...senderDisplayAmounts,
    ...recipientDisplayAmounts,

    pubkey: crypto.randomUUID() as Pubkey,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives ln intraledger",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordWalletIdIntraLedgerPayment: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
  recipientDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.WalletIdIntraledgerLedgerMetadata({
    ...senderDisplayAmounts,
    ...recipientDisplayAmounts,

    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives walletId intraledger",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordOnChainIntraLedgerPayment: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
  recipientDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.OnChainIntraledgerLedgerMetadata({
    ...senderDisplayAmounts,
    ...recipientDisplayAmounts,

    sendAll: false,
    payeeAddresses: ["address1" as OnChainAddress],
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives onchain intraledger",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordLnTradeIntraAccountTxn: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.LnTradeIntraAccountLedgerMetadata({
    paymentHash: crypto.randomUUID() as PaymentHash,

    ...senderDisplayAmounts,

    pubkey: crypto.randomUUID() as Pubkey,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives ln trade",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordWalletIdTradeIntraAccountTxn: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.WalletIdTradeIntraAccountLedgerMetadata({
    ...senderDisplayAmounts,

    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives walletId trade",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordOnChainTradeIntraAccountTxn: RecordInternalTxTestFn = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.OnChainTradeIntraAccountLedgerMetadata({
    ...senderDisplayAmounts,

    sendAll: false,
    payeeAddresses: ["address1" as OnChainAddress],
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: ZERO_SATS,
      usdProtocolAndBankFee: ZERO_CENTS,
    },
  })

  return LedgerFacade.recordIntraledger({
    description: "sends/receives onchain trade",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata,
    additionalCreditMetadata,
    additionalInternalMetadata,
  })
}

export const recordReceiveOnChainFeeReconciliation = async ({
  estimatedFee,
  actualFee,
}: {
  estimatedFee: BtcPaymentAmount
  actualFee: BtcPaymentAmount
}) => {
  const { metadata } = LedgerFacade.OnChainFeeReconciliationLedgerMetadata({
    payoutId: crypto.randomUUID() as PayoutId,
    txHash: generateHash() as OnChainTxHash,
    pending: true,
  })

  return LedgerFacade.recordReceiveOnChainFeeReconciliation({
    estimatedFee,
    actualFee,
    metadata,
  })
}

// Non-LedgerFacade helpers from legacy admin service
// ======

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
export const recordLnChannelOpenOrClosingFee = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.LnChannelOpenOrClosingFee({
    txId: "txId" as OnChainTxHash,
  })

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("LnChannelOpenOrClosingFee")
    .debit(bankOwnerPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(lndLedgerAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

// @ts-ignore-next-line no-implicit-any error
export const recordLndEscrowDebit = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.Escrow()

  const savedEntry = await MainBook.entry("escrow")
    .debit(escrowAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(lndLedgerAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

// @ts-ignore-next-line no-implicit-any error
export const recordLndEscrowCredit = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.Escrow()

  const savedEntry = await MainBook.entry("escrow")
    .debit(lndLedgerAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(escrowAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

// @ts-ignore-next-line no-implicit-any error
export const recordLnRoutingRevenue = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.LnRoutingRevenue(new Date())

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("routing fee")
    .debit(lndLedgerAccountId, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(bankOwnerPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

export const recordColdStorageTxReceive = async ({
  paymentAmount,
}: {
  paymentAmount: { usd: UsdPaymentAmount; btc: BtcPaymentAmount }
}) => {
  const amount = Number(paymentAmount.btc.amount)
  const fee = toSats(2000)

  const metadata: AddColdStorageReceiveLedgerMetadata = {
    type: LedgerTransactionType.ToColdStorage,
    pending: false,
    hash: "txHash" as OnChainTxHash,
    payee_addresses: ["address1" as OnChainAddress],
    fee,
    feeUsd: 1 as DisplayCurrencyBaseAmount,
    usd: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    currency: WalletCurrency.Btc,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("cold storage receive")
    .debit(bankOwnerPath, fee, metadata)
    .debit(coldStorageAccountId, amount, metadata)
    .credit(lndLedgerAccountId, amount + fee, metadata)
    .commit()

  return translateToLedgerJournal(savedEntry)
}

export const recordColdStorageTxSend = async ({
  paymentAmount,
}: {
  paymentAmount: { usd: UsdPaymentAmount; btc: BtcPaymentAmount }
}) => {
  const amount = Number(paymentAmount.btc.amount)
  const fee = toSats(2000)

  const metadata: AddColdStorageSendLedgerMetadata = {
    type: LedgerTransactionType.ToHotWallet,
    pending: false,
    hash: "txHash" as OnChainTxHash,
    payee_addresses: ["address1" as OnChainAddress],
    fee,
    feeUsd: 1 as DisplayCurrencyBaseAmount,
    usd: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    currency: WalletCurrency.Btc,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("cold storage send")
    .debit(bankOwnerPath, fee, metadata)
    .debit(lndLedgerAccountId, amount, metadata)
    .credit(coldStorageAccountId, amount + fee, metadata)
    .commit()

  return translateToLedgerJournal(savedEntry)
}
