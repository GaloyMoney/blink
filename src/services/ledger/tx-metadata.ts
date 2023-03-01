import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"

export const LnSendLedgerMetadata = ({
  paymentHash,
  pubkey,
  paymentAmounts,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  feeKnownInAdvance,
  memoOfPayer,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentAmounts: AmountsAndFees

  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency

  feeKnownInAdvance: boolean
  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddLnSendLedgerMetadata = {
    type: LedgerTransactionType.Payment,
    pending: true,
    hash: paymentHash,
    pubkey,
    feeKnownInAdvance,
    memoPayer: memoOfPayer,

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
  paymentAmounts,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  payeeAddresses,
  sendAll,
  memoOfPayer,
}: {
  onChainTxHash: OnChainTxHash
  paymentAmounts: AmountsAndFees

  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency

  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddOnchainSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainPayment,
    pending: true,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    sendAll,
    memoPayer: memoOfPayer,

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

export const OnChainReceiveLedgerMetadata = ({
  onChainTxHash,
  paymentAmounts,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,

  payeeAddresses,
}: {
  onChainTxHash: OnChainTxHash
  paymentAmounts: AmountsAndFees

  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency

  payeeAddresses: OnChainAddress[]
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: OnChainReceiveLedgerMetadata = {
    type: LedgerTransactionType.OnchainReceipt,
    pending: false,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,

    // Amounts are after fee is deducted
    satsAmount: toSats(satsAmount),
    centsAmount: toCents(centsAmount),
    displayAmount: amountDisplayCurrency,

    satsFee: toSats(satsFee),
    centsFee: toCents(centsFee),
    displayFee: feeDisplayCurrency,

    displayCurrency,
  }
  return metadata
}

export const LnReceiveLedgerMetadata = ({
  paymentHash,
  pubkey,
  paymentAmounts,

  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentAmounts: AmountsAndFees

  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: LnReceiveLedgerMetadata = {
    type: LedgerTransactionType.Invoice,
    pending: false,
    hash: paymentHash,
    pubkey,

    // Amounts are after fee is deducted
    satsAmount: toSats(satsAmount),
    centsAmount: toCents(centsAmount),
    displayAmount: amountDisplayCurrency,

    satsFee: toSats(satsFee),
    centsFee: toCents(centsFee),
    displayFee: feeDisplayCurrency,

    displayCurrency,
  }
  return metadata
}

export const LnFeeReimbursementReceiveLedgerMetadata = ({
  paymentAmounts,
  paymentHash,
  journalId,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
}: {
  paymentAmounts: AmountsAndFees
  paymentHash: PaymentHash
  journalId: LedgerJournalId
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: FeeReimbursementLedgerMetadata = {
    type: LedgerTransactionType.LnFeeReimbursement,
    hash: paymentHash,
    related_journal: journalId,
    pending: false,

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
  payeeAddresses,
  sendAll,
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddOnChainIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainIntraLedger,
    pending: false,
    memoPayer: undefined,
    username: senderUsername,
    payee_addresses: payeeAddresses,
    sendAll,

    satsFee: toSats(satsFee),

    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    username: recipientUsername,
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }

  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

export const WalletIdIntraledgerLedgerMetadata = ({
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddWalletIdIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.IntraLedger,
    pending: false,
    memoPayer: memoOfPayer,
    username: senderUsername,

    satsFee: toSats(satsFee),

    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }

  const debitAccountAdditionalMetadata = {
    username: recipientUsername,
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }

  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

export const LnIntraledgerLedgerMetadata = ({
  paymentHash,
  pubkey,
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddLnIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.LnIntraLedger,
    pending: false,
    memoPayer: undefined,
    username: senderUsername,
    hash: paymentHash,
    pubkey,

    satsFee: toSats(satsFee),

    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }

  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    username: recipientUsername,
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }

  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

export const OnChainTradeIntraAccountLedgerMetadata = ({
  payeeAddresses,
  sendAll,
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
}: {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddOnChainTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.OnChainTradeIntraAccount,
    pending: false,
    memoPayer: undefined,
    payee_addresses: payeeAddresses,
    sendAll,

    satsFee: toSats(satsFee),

    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }

  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }
  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

export const WalletIdTradeIntraAccountLedgerMetadata = ({
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
}: {
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddWalletIdTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.WalletIdTradeIntraAccount,
    pending: false,
    memoPayer: memoOfPayer,

    satsFee: toSats(satsFee),

    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }

  const debitAccountAdditionalMetadata = {
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }

  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

export const LnTradeIntraAccountLedgerMetadata = ({
  paymentHash,
  pubkey,
  paymentAmounts,
  senderFeeDisplayCurrency,
  senderAmountDisplayCurrency,
  senderDisplayCurrency,
  recipientFeeDisplayCurrency,
  recipientAmountDisplayCurrency,
  recipientDisplayCurrency,
  memoOfPayer,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentAmounts: AmountsAndFees

  senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
  senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
  senderDisplayCurrency: DisplayCurrency

  recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
  recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
  recipientDisplayCurrency: DisplayCurrency

  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolAndBankFee: { amount: satsFee },
    usdProtocolAndBankFee: { amount: centsFee },
  } = paymentAmounts

  const metadata: AddLnTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.LnTradeIntraAccount,
    pending: false,
    memoPayer: undefined,
    hash: paymentHash,
    pubkey,

    satsFee: toSats(satsFee),
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }

  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    displayAmount: senderAmountDisplayCurrency,
    displayFee: senderFeeDisplayCurrency,
    displayCurrency: senderDisplayCurrency,
  }

  const creditAccountAdditionalMetadata = {
    displayAmount: recipientAmountDisplayCurrency,
    displayFee: recipientFeeDisplayCurrency,
    displayCurrency: recipientDisplayCurrency,
  }

  return { metadata, debitAccountAdditionalMetadata, creditAccountAdditionalMetadata }
}

// Non-LedgerFacade constructors from legacy admin service

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
