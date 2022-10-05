import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"

export const LnSendLedgerMetadata = <S extends WalletCurrency, R extends WalletCurrency>({
  paymentHash,
  pubkey,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  feeKnownInAdvance,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentFlow: PaymentFlowState<S, R>
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  feeKnownInAdvance: boolean
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: AddLnSendLedgerMetadata = {
    type: LedgerTransactionType.Payment,
    pending: true,
    hash: paymentHash,
    pubkey,
    feeKnownInAdvance,

    fee: toSats(satsFee),
    feeUsd: (feeDisplayCurrency / 100) as DisplayCurrencyBaseAmount,
    usd: ((amountDisplayCurrency + feeDisplayCurrency) /
      100) as DisplayCurrencyBaseAmount,

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
  const convertCentsToUsdAsDollars = (cents: DisplayCurrencyBaseAmount) =>
    Number((Number(cents) / 100).toFixed(2))

  const metadata: LnReceiveLedgerMetadata = {
    type: LedgerTransactionType.Invoice,
    pending: false,
    hash: paymentHash,
    fee: Number(fee.amount) as Satoshis,
    feeUsd: convertCentsToUsdAsDollars(feeDisplayCurrency),
    usd: convertCentsToUsdAsDollars(amountDisplayCurrency),
  }
  return metadata
}

export const LnFeeReimbursementReceiveLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  paymentHash,
  journalId,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
}: {
  paymentFlow: PaymentFlowState<S, R>
  paymentHash: PaymentHash
  journalId: LedgerJournalId
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: FeeReimbursementLedgerMetadata = {
    type: LedgerTransactionType.LnFeeReimbursement,
    hash: paymentHash,
    related_journal: journalId,
    pending: false,

    usd: ((amountDisplayCurrency + feeDisplayCurrency) /
      100) as DisplayCurrencyBaseAmount,

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

export const WalletIdIntraledgerLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  paymentFlow: PaymentFlowState<S, R>
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: NewAddWalletIdIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.IntraLedger,
    pending: false,
    memoPayer: memoOfPayer,
    username: senderUsername,

    usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

    satsFee: toSats(satsFee),
    displayFee: feeDisplayCurrency,
    displayAmount: amountDisplayCurrency,

    displayCurrency,
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  const debitAccountAdditionalMetadata = {
    username: recipientUsername,
  }

  return { metadata, debitAccountAdditionalMetadata }
}

export const LnIntraledgerLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentHash,
  pubkey,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentFlow: PaymentFlowState<S, R>
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  memoOfPayer?: string
  senderUsername?: Username
  recipientUsername?: Username
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: NewAddLnIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.LnIntraLedger,
    pending: false,
    memoPayer: undefined,
    username: senderUsername,
    hash: paymentHash,
    pubkey,

    usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

    satsFee: toSats(satsFee),
    displayFee: feeDisplayCurrency,
    displayAmount: amountDisplayCurrency,

    displayCurrency,
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
    username: recipientUsername,
  }
  return { metadata, debitAccountAdditionalMetadata }
}

export const OnChainTradeIntraAccountLedgerMetadata = ({
  amountDisplayCurrency,
  payeeAddresses,
  sendAll,
  memoOfPayer,
}: {
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  memoOfPayer?: string
}) => {
  const metadata: AddOnChainTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.OnChainTradeIntraAccount,
    pending: false,
    usd: amountDisplayCurrency,
    memoPayer: undefined,
    payee_addresses: payeeAddresses,
    sendAll,
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
  }
  return { metadata, debitAccountAdditionalMetadata }
}

export const WalletIdTradeIntraAccountLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
}: {
  paymentFlow: PaymentFlowState<S, R>
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: NewAddWalletIdTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.WalletIdTradeIntraAccount,
    pending: false,
    memoPayer: memoOfPayer,

    usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

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

export const LnTradeIntraAccountLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentHash,
  pubkey,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
  paymentFlow: PaymentFlowState<S, R>
  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
  memoOfPayer?: string
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: NewAddLnTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.LnTradeIntraAccount,
    pending: false,
    memoPayer: undefined,
    hash: paymentHash,
    pubkey,

    usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

    satsFee: toSats(satsFee),
    displayFee: feeDisplayCurrency,
    displayAmount: amountDisplayCurrency,

    displayCurrency,
    centsAmount: toCents(centsAmount),
    satsAmount: toSats(satsAmount),
    centsFee: toCents(centsFee),
  }
  const debitAccountAdditionalMetadata = {
    memoPayer: memoOfPayer,
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
