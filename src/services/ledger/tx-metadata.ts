import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"

export const LnSendLedgerMetadata = ({
  paymentHash,
  fee,
  pubkey,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  feeKnownInAdvance,
}: {
  paymentHash: PaymentHash
  fee: BtcPaymentAmount
  pubkey: Pubkey
  paymentFlow: { btcPaymentAmount: BtcPaymentAmount; btcProtocolFee: BtcPaymentAmount }
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  feeKnownInAdvance: boolean
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    btcProtocolFee: { amount: satsFee },
  } = paymentFlow
  const centsAmount = Math.round((amountDisplayCurrency - feeDisplayCurrency) * 100)
  const centsFee = Math.round(feeDisplayCurrency * 100)

  const metadata: AddLnSendLedgerMetadata = {
    type: LedgerTransactionType.Payment,
    pending: true,
    hash: paymentHash,
    pubkey,
    feeKnownInAdvance,

    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,

    satsFee: toSats(satsFee),
    displayFee: feeDisplayCurrency,
    displayAmount: amountDisplayCurrency,

    displayCurrency,
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  return metadata
}

export const OnChainSendLedgerMetadata = ({
  onChainTxHash,
  fee,
  feeDisplayCurrency,
  amountDisplayCurrency,
  payeeAddresses,
  sendAll,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}) => {
  const metadata: AddOnchainSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainPayment,
    pending: true,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,
    sendAll,
  }

  return metadata
}

export const OnChainReceiveLedgerMetadata = ({
  onChainTxHash,
  fee,
  feeDisplayCurrency,
  amountDisplayCurrency,
  payeeAddresses,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
}) => {
  const metadata: OnChainReceiveLedgerMetadata = {
    type: LedgerTransactionType.OnchainReceipt,
    pending: false,
    hash: onChainTxHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,
    payee_addresses: payeeAddresses,
  }
  return metadata
}

export const LnReceiveLedgerMetadata = ({
  paymentHash,
  fee,
  feeDisplayCurrency,
  amountDisplayCurrency,
}: {
  paymentHash: PaymentHash
  fee: BtcPaymentAmount
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  pubkey: Pubkey
}) => {
  const metadata: LnReceiveLedgerMetadata = {
    type: LedgerTransactionType.Invoice,
    pending: false,
    hash: paymentHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,
  }
  return metadata
}

export const LnFeeReimbursementReceiveLedgerMetadata = ({
  paymentFlow,
  paymentHash,
  journalId,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
}: {
  paymentFlow: { btcPaymentAmount: BtcPaymentAmount; btcProtocolFee: BtcPaymentAmount }
  paymentHash: PaymentHash
  journalId: LedgerJournalId
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    btcProtocolFee: { amount: satsFee },
  } = paymentFlow
  const centsAmount = Math.round((amountDisplayCurrency - feeDisplayCurrency) * 100)
  const centsFee = Math.round(feeDisplayCurrency * 100)

  const metadata: FeeReimbursementLedgerMetadata = {
    type: LedgerTransactionType.LnFeeReimbursement,
    hash: paymentHash,
    related_journal: journalId,
    pending: false,

    usd: amountDisplayCurrency,

    satsFee: toSats(satsFee),
    displayFee: feeDisplayCurrency,
    displayAmount: amountDisplayCurrency,

    displayCurrency,
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  return metadata
}

export const OnChainIntraledgerLedgerMetadata = ({
  amountDisplayCurrency,
  payeeAddresses,
  sendAll,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const metadata: AddOnChainIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainIntraLedger,
    pending: false,
    usd: amountDisplayCurrency,
    memoPayer: undefined,
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
  amountDisplayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const metadata: AddWalletIdIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.IntraLedger,
    pending: false,
    usd: amountDisplayCurrency,
    memoPayer: memoOfPayer,
    username: senderUsername,
  }
  const debitAccountAdditionalMetadata = {
    username: recipientUsername,
  }

  return { metadata, debitAccountAdditionalMetadata }
}

export const LnIntraledgerLedgerMetadata = ({
  amountDisplayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
  pubkey,
  paymentHash,
}: {
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
  pubkey: Pubkey
  paymentHash: PaymentHash
}) => {
  const metadata: AddLnIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.LnIntraLedger,
    pending: false,
    usd: amountDisplayCurrency,
    memoPayer: undefined,
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
  feeDisplayCurrency,
  amountDisplayCurrency,
  payeeAddresses,
  currency,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  currency: WalletCurrency
}) => {
  const metadata: AddColdStorageReceiveLedgerMetadata = {
    type: LedgerTransactionType.ToColdStorage,
    currency,
    pending: false,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,
  }

  return metadata
}

export const ColdStorageSendLedgerMetada = ({
  onChainTxHash,
  fee,
  feeDisplayCurrency,
  amountDisplayCurrency,
  payeeAddress,
  currency,
}: {
  onChainTxHash: OnChainTxHash
  fee: BtcPaymentAmount
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddress: OnChainAddress
  currency: WalletCurrency
}) => {
  const metadata: AddColdStorageSendLedgerMetadata = {
    type: LedgerTransactionType.ToHotWallet,
    currency,
    pending: false,
    hash: onChainTxHash,
    payee_addresses: [payeeAddress],
    fee: Number(fee.amount) as Satoshis,
    feeUsd: feeDisplayCurrency,
    usd: amountDisplayCurrency,
  }

  return metadata
}
