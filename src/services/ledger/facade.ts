import { UnknownLedgerError } from "@domain/ledger"

import { WalletCurrency } from "@domain/shared"

import { MainBook } from "./books"
import { EntryBuilder, toLedgerAccountDescriptor, toLedgerAccountId } from "./domain"
import { persistAndReturnEntry } from "./helpers"
import * as caching from "./caching"
export * from "./tx-metadata"

const ZERO_FEE = {
  usdProtocolFee: {
    currency: WalletCurrency.Usd,
    amount: 0n,
  },
  btcProtocolFee: {
    currency: WalletCurrency.Btc,
    amount: 0n,
  },
} as const

const staticAccountIds = async () => {
  return {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
}

type RecordSendArgs<T extends WalletCurrency> = {
  description: string
  senderWalletDescriptor: WalletDescriptor<T>
  amount: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
  metadata: SendLedgerMetadata
  fee?: {
    usdProtocolFee: UsdPaymentAmount
    btcProtocolFee: BtcPaymentAmount
  }
}

type RecordReceiveArgs<T extends WalletCurrency> = {
  description: string
  receiverWalletDescriptor: WalletDescriptor<T>
  amount: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
  metadata: ReceiveLedgerMetadata
  fee?: {
    usdProtocolFee: UsdPaymentAmount
    btcProtocolFee: BtcPaymentAmount
  }
}

type RecordIntraledgerArgs<T extends WalletCurrency, V extends WalletCurrency> = {
  description: string
  senderWalletDescriptor: WalletDescriptor<T>
  receiverWalletDescriptor: WalletDescriptor<V>
  amount: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
  metadata: IntraledgerLedgerMetadata
  additionalDebitMetadata: any
}

export const recordSend = async <T extends WalletCurrency>({
  description,
  senderWalletDescriptor,
  amount,
  fee,
  metadata,
}: RecordSendArgs<T>) => {
  const actualFee = fee || ZERO_FEE

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount(amount)
    .withFee(actualFee)
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
    })
    .creditLnd()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const recordReceive = async <T extends WalletCurrency>({
  description,
  receiverWalletDescriptor,
  amount,
  fee,
  metadata,
}: RecordReceiveArgs<T>) => {
  const actualFee = fee || ZERO_FEE

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount(amount)
    .withFee(actualFee)
    .debitLnd()
    .creditAccount(toLedgerAccountDescriptor(receiverWalletDescriptor))

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const getLedgerAccountBalanceForWalletId = async <T extends WalletCurrency>({
  id: walletId,
  currency: walletCurrency,
}: WalletDescriptor<T>): Promise<PaymentAmount<T> | LedgerError> => {
  try {
    const { balance } = await MainBook.balance({
      account: toLedgerAccountId(walletId),
    })
    return { amount: BigInt(balance), currency: walletCurrency }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const recordIntraledger = async <
  T extends WalletCurrency,
  V extends WalletCurrency,
>({
  description,
  senderWalletDescriptor,
  receiverWalletDescriptor,
  amount,
  metadata,
  additionalDebitMetadata: additionalMetadata,
}: RecordIntraledgerArgs<T, V>) => {
  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount(amount)
    .withFee(ZERO_FEE)
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata,
    })
    .creditAccount(toLedgerAccountDescriptor(receiverWalletDescriptor))

  return persistAndReturnEntry({
    entry,
    hash: "hash" in metadata ? metadata.hash : undefined,
  })
}
