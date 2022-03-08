import { LedgerTransactionType } from "@domain/ledger"

export const LnSendLedgerMetadata = ({
  paymentHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
  pubkey,
  feeKnownInAdvance,
}: {
  paymentHash: PaymentHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}) => {
  const metadata: AddLnSendLedgerMetadata = {
    type: LedgerTransactionType.Payment,
    pending: true,
    hash: paymentHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
    pubkey,
    feeKnownInAdvance,
  }
  return metadata
}

export const OnChainSendLedgerMetadata = ({
  onChainTxHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
  payeeAddresses,
  sendAll,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}) => {
  const metadata: AddOnchainSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainPayment,
    pending: true,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
    sendAll,
  }

  return metadata
}

export const OnChainReceiveLedgerMetadata = ({
  onChainTxHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
  payeeAddresses,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
}) => {
  const metadata: OnChainReceiveLedgerMetadata = {
    type: LedgerTransactionType.OnchainReceipt,
    pending: false,
    hash: onChainTxHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
    payee_addresses: payeeAddresses,
  }
  return metadata
}

export const LnReceiveLedgerMetadata = ({
  paymentHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
}: {
  paymentHash: PaymentHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  pubkey: Pubkey
}) => {
  const metadata: LnReceiveLedgerMetadata = {
    type: LedgerTransactionType.Invoice,
    pending: false,
    hash: paymentHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
  }
  return metadata
}

export const LnFeeReimbursementReceiveLedgerMetadata = ({
  paymentHash,
  journalId,
  amountDisplayUsd,
}: {
  paymentHash: PaymentHash
  journalId: LedgerJournalId
  amountDisplayUsd: DisplayCurrencyBaseAmount
}) => {
  const metadata: FeeReimbursementLedgerMetadata = {
    type: LedgerTransactionType.LnFeeReimbursement,
    hash: paymentHash,
    related_journal: journalId,
    pending: false,
    usd: amountDisplayUsd,
  }
  return metadata
}

export const OnChainIntraledgerLedgerMetadata = ({
  amountDisplayUsd,
  payeeAddresses,
  sendAll,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  memoOfPayer: string | null
  senderUsername: Username | null
  recipientUsername: Username | null
}) => {
  const metadata: AddOnChainIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainIntraLedger,
    pending: false,
    usd: amountDisplayUsd,
    memoPayer: null,
    username: senderUsername,
    payee_addresses: payeeAddresses,
    sendAll,
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    username: recipientUsername,
  }
  return { metadata, debitAccountAdditionalMetadata }
}

export const WalletIdIntraledgerLedgerMetadata = ({
  amountDisplayUsd,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  amountDisplayUsd: DisplayCurrencyBaseAmount
  memoOfPayer: string | null
  senderUsername: Username | null
  recipientUsername: Username | null
}) => {
  const metadata: AddWalletIdIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.IntraLedger,
    pending: false,
    usd: amountDisplayUsd,
    memoPayer: memoOfPayer,
    username: senderUsername,
  }
  const debitAccountAdditionalMetadata = {
    username: recipientUsername,
  }

  return { metadata, debitAccountAdditionalMetadata }
}

export const LnIntraledgerLedgerMetadata = ({
  amountDisplayUsd,
  memoOfPayer,
  senderUsername,
  recipientUsername,
  pubkey,
  paymentHash,
}: {
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  memoOfPayer: string | null
  senderUsername: Username | null
  recipientUsername: Username | null
  pubkey: Pubkey
  paymentHash: PaymentHash
}) => {
  const metadata: AddLnIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.LnIntraLedger,
    pending: false,
    usd: amountDisplayUsd,
    memoPayer: null,
    username: senderUsername,
    hash: paymentHash,
    pubkey,
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    username: recipientUsername,
  }
  return { metadata, debitAccountAdditionalMetadata }
}

export const LnChannelOpenOrClosingFee = ({ txId }: { txId: OnChainTxHash }) => {
  const metadata: LnChannelOpenOrClosingFee = {
    type: LedgerTransactionType.Fee,
    pending: false,
    txid: txId,
  }

  return metadata
}

export const Escrow = () => {
  const metadata: LedgerMetadata = {
    type: LedgerTransactionType.Escrow,
    pending: false,
  }

  return metadata
}

export const LnRoutingRevenue = (collectedOn: Date) => {
  const metadata: LnRoutingRevenueLedgerMetadata = {
    type: LedgerTransactionType.RoutingRevenue,
    feesCollectedOn: collectedOn.toDateString(),
    pending: false,
  }

  return metadata
}

export const ColdStorageReceiveLedgerMetada = ({
  onChainTxHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
  payeeAddresses,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
}) => {
  const metadata: AddColdStorageReceiveLedgerMetadata = {
    type: LedgerTransactionType.ToColdStorage,
    pending: false,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
  }

  return metadata
}

export const ColdStorageSendLedgerMetada = ({
  onChainTxHash,
  fee,
  feeDisplayUsd,
  amountDisplayUsd,
  payeeAddress,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayUsd: DisplayCurrencyBaseAmount
  amountDisplayUsd: DisplayCurrencyBaseAmount
  payeeAddress: OnChainAddress
}) => {
  const metadata: AddColdStorageSendLedgerMetadata = {
    type: LedgerTransactionType.ToHotWallet,
    pending: false,
    hash: onChainTxHash,
    payee_addresses: [payeeAddress],
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayUsd,
    usd: amountDisplayUsd,
  }

  return metadata
}
