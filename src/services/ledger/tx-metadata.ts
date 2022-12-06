import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"

const convertCentsToUsdAsDollars = (cents: DisplayCurrencyBaseAmount) =>
  Number((Number(cents) / 100).toFixed(2))

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
    feeUsd: convertCentsToUsdAsDollars(feeDisplayCurrency),
    usd: convertCentsToUsdAsDollars(
      (amountDisplayCurrency + feeDisplayCurrency) as DisplayCurrencyBaseAmount,
    ),

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

export const OnChainSendLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  onChainTxHash,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  payeeAddresses,
  sendAll,
}: {
  onChainTxHash: OnChainTxHash
  paymentFlow: OnChainPaymentFlowState<S, R>

  feeDisplayCurrency: DisplayCurrencyBaseAmount
  amountDisplayCurrency: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency

  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}) => {
  const {
    btcPaymentAmount: { amount: satsAmount },
    usdPaymentAmount: { amount: centsAmount },
    btcProtocolFee: { amount: satsFee },
    usdProtocolFee: { amount: centsFee },
  } = paymentFlow

  const metadata: AddOnchainSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainPayment,
    pending: true,
    hash: onChainTxHash,
    payee_addresses: payeeAddresses,
    sendAll,

    fee: toSats(satsFee),
    feeUsd: convertCentsToUsdAsDollars(feeDisplayCurrency),
    usd: convertCentsToUsdAsDollars(amountDisplayCurrency),

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

export const OnChainIntraledgerLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  payeeAddresses,
  sendAll,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
  senderUsername,
  recipientUsername,
}: {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  paymentFlow: OnChainPaymentFlowState<S, R>

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

  const metadata: NewAddOnChainIntraledgerSendLedgerMetadata = {
    type: LedgerTransactionType.OnchainIntraLedger,
    pending: false,
    memoPayer: undefined,
    username: senderUsername,
    payee_addresses: payeeAddresses,
    sendAll,

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

export const OnChainTradeIntraAccountLedgerMetadata = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  payeeAddresses,
  sendAll,
  paymentFlow,
  feeDisplayCurrency,
  amountDisplayCurrency,
  displayCurrency,
  memoOfPayer,
}: {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
  paymentFlow: OnChainPaymentFlowState<S, R>

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

  const metadata: NewAddOnChainTradeIntraAccountLedgerMetadata = {
    type: LedgerTransactionType.OnChainTradeIntraAccount,
    pending: false,
    memoPayer: undefined,
    payee_addresses: payeeAddresses,
    sendAll,

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
