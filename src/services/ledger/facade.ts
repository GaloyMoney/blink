import { UnknownLedgerError } from "@domain/ledger"

import { ZERO_FEE } from "@domain/shared"

import { MainBook } from "./books"
import { toLedgerAccountDescriptor, toLedgerAccountId, EntryBuilder } from "./domain"
import { persistAndReturnEntry } from "./helpers"
import * as caching from "./caching"
export * from "./tx-metadata"

const staticAccountIds = async () => {
  return {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
}

export const recordSend = async ({
  description,
  senderWalletDescriptor,
  amount,
  fee,
  metadata,
}: RecordSendArgs) => {
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

export const recordReceive = async ({
  description,
  receiverWalletDescriptor,
  amount,
  fee,
  metadata,
}: RecordReceiveArgs) => {
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

export const recordIntraledger = async ({
  description,
  senderWalletDescriptor,
  receiverWalletDescriptor,
  amount,
  metadata,
  additionalDebitMetadata: additionalMetadata,
}: RecordIntraledgerArgs) => {
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
