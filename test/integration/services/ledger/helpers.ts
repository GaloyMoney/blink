import crypto from "crypto"

import { getDisplayCurrencyConfig } from "@config"

import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@domain/shared"
import { DisplayCurrency } from "@domain/fiat"
import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"

import * as LedgerFacade from "@services/ledger/facade"
import { MainBook } from "@services/ledger/books"
import { getBankOwnerWalletId } from "@services/ledger/caching"
import {
  bitcoindAccountingPath,
  escrowAccountingPath,
  lndAccountingPath,
} from "@services/ledger/accounts"
import { translateToLedgerJournal } from "@services/ledger"
import { toSats } from "@domain/bitcoin"

export const recordReceiveLnPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

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

    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: DisplayCurrency.Usd,
  })

  return LedgerFacade.recordReceive({
    description: "receives bitcoin via ln",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    txMetadata: { hash: paymentHash },
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordReceiveOnChainPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const onChainTxHash = crypto.randomUUID() as OnChainTxHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.OnChainReceiveLedgerMetadata({
    onChainTxHash,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },

    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: DisplayCurrency.Usd,

    payeeAddresses: ["address1" as OnChainAddress],
  })

  return LedgerFacade.recordReceive({
    description: "receives bitcoin via onchain",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordSendLnPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const { metadata, debitAccountAdditionalMetadata, internalAccountsAdditionalMetadata } =
    LedgerFacade.LnSendLedgerMetadata({
      paymentHash: crypto.randomUUID() as PaymentHash,
      feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
      amountDisplayCurrency: Number(
        paymentAmount.usd.amount,
      ) as DisplayCurrencyBaseAmount,
      displayCurrency: getDisplayCurrencyConfig().code,
      pubkey: crypto.randomUUID() as Pubkey,
      feeKnownInAdvance: true,
      paymentAmounts: {
        btcPaymentAmount: paymentAmount.btc,
        usdPaymentAmount: paymentAmount.usd,
        btcProtocolAndBankFee: bankFee.btc,
        usdProtocolAndBankFee: bankFee.usd,
      },
    })

  return LedgerFacade.recordSend({
    description: "sends bitcoin via ln",
    amountToDebitSender: paymentAmount,
    senderWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalDebitMetadata: debitAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordSendOnChainPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const { metadata, debitAccountAdditionalMetadata, internalAccountsAdditionalMetadata } =
    LedgerFacade.OnChainSendLedgerMetadata({
      onChainTxHash: crypto.randomUUID() as OnChainTxHash,
      paymentAmounts: {
        btcPaymentAmount: paymentAmount.btc,
        usdPaymentAmount: paymentAmount.usd,
        btcProtocolAndBankFee: bankFee.btc,
        usdProtocolAndBankFee: bankFee.usd,
      },

      feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
      amountDisplayCurrency: Number(
        paymentAmount.usd.amount,
      ) as DisplayCurrencyBaseAmount,
      displayCurrency: getDisplayCurrencyConfig().code,

      payeeAddresses: ["address1" as OnChainAddress],
      sendAll: false,
    })

  return LedgerFacade.recordSend({
    description: "sends bitcoin via onchain",
    amountToDebitSender: paymentAmount,
    senderWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    additionalDebitMetadata: debitAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
}

export const recordLnFeeReimbursement = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnFeeReimbursementReceiveLedgerMetadata({
    paymentHash,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: getDisplayCurrencyConfig().code,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },
    journalId: "031a419636dbf6d25981d6d2" as LedgerJournalId,
  })

  return LedgerFacade.recordReceive({
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

export const recordLnFailedPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnFailedPaymentReceiveLedgerMetadata({
    paymentHash,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: getDisplayCurrencyConfig().code,
    paymentAmounts: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolAndBankFee: bankFee.btc,
      usdProtocolAndBankFee: bankFee.usd,
    },
    journalId: "031a419636dbf6d25981d6d2" as LedgerJournalId,
  })

  return LedgerFacade.recordReceive({
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

export const recordLnIntraLedgerPayment = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.LnIntraledgerLedgerMetadata({
    paymentHash: crypto.randomUUID() as PaymentHash,

    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

    recipientAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    recipientFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    recipientDisplayCurrency: DisplayCurrency.Usd,

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

export const recordWalletIdIntraLedgerPayment = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.WalletIdIntraledgerLedgerMetadata({
    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

    recipientAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    recipientFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    recipientDisplayCurrency: DisplayCurrency.Usd,

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

export const recordOnChainIntraLedgerPayment = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.OnChainIntraledgerLedgerMetadata({
    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

    recipientAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    recipientFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    recipientDisplayCurrency: DisplayCurrency.Usd,

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

export const recordLnTradeIntraAccountTxn = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.LnTradeIntraAccountLedgerMetadata({
    paymentHash: crypto.randomUUID() as PaymentHash,
    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

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

export const recordWalletIdTradeIntraAccountTxn = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.WalletIdTradeIntraAccountLedgerMetadata({
    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

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

export const recordOnChainTradeIntraAccountTxn = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const {
    metadata,
    debitAccountAdditionalMetadata: additionalDebitMetadata,
    creditAccountAdditionalMetadata: additionalCreditMetadata,
    internalAccountsAdditionalMetadata: additionalInternalMetadata,
  } = LedgerFacade.OnChainTradeIntraAccountLedgerMetadata({
    senderAmountDisplayCurrency: Number(
      paymentAmount.usd.amount,
    ) as DisplayCurrencyBaseAmount,
    senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
    senderDisplayCurrency: DisplayCurrency.Usd,

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

// Non-LedgerFacade helpers from legacy admin service
// ======

export const recordLnChannelOpenOrClosingFee = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.LnChannelOpenOrClosingFee({
    txId: "txId" as OnChainTxHash,
  })

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("LnChannelOpenOrClosingFee")
    .debit(bankOwnerPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(lndAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

export const recordLndEscrowDebit = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.Escrow()

  const savedEntry = await MainBook.entry("escrow")
    .debit(escrowAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(lndAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

export const recordLndEscrowCredit = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.Escrow()

  const savedEntry = await MainBook.entry("escrow")
    .debit(lndAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .credit(escrowAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
    .commit()

  return translateToLedgerJournal(savedEntry)
}

export const recordLnRoutingRevenue = async ({ paymentAmount }) => {
  const amount = Number(paymentAmount.btc.amount)
  const metadata = LedgerFacade.LnRoutingRevenue(new Date(Date.now()))

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  const savedEntry = await MainBook.entry("routing fee")
    .debit(lndAccountingPath, amount, { ...metadata, currency: WalletCurrency.Btc })
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
    .debit(bitcoindAccountingPath, amount, metadata)
    .credit(lndAccountingPath, amount + fee, metadata)
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
    .debit(lndAccountingPath, amount, metadata)
    .credit(bitcoindAccountingPath, amount + fee, metadata)
    .commit()

  return translateToLedgerJournal(savedEntry)
}
