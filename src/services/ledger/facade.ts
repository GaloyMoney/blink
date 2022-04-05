import { UnknownLedgerError } from "@domain/ledger"

import { ZERO_BANK_FEE, AmountCalculator, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

import { MainBook } from "./books"
import { toLedgerAccountDescriptor, toLedgerAccountId, EntryBuilder } from "./domain"
import { persistAndReturnEntry } from "./helpers"
import * as caching from "./caching"
export * from "./tx-metadata"

const calc = AmountCalculator()

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
  amountToDebitSender,
  bankFee,
  metadata,
}: RecordSendArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount({
      usdWithFees: amountToDebitSender.usd,
      btcWithFees: amountToDebitSender.btc,
    })
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
    })
    .creditLnd()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const recordReceive = async ({
  description,
  receiverWalletDescriptor,
  amountToCreditReceiver,
  bankFee,
  metadata,
}: RecordReceiveArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  const amountWithFees = {
    usdWithFees: calc.add(amountToCreditReceiver.usd, actualFee.usd),
    btcWithFees: calc.add(amountToCreditReceiver.btc, actualFee.btc),
  }

  entry = builder
    .withTotalAmount(amountWithFees)
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
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
    .withTotalAmount({ usdWithFees: amount.usd, btcWithFees: amount.btc })
    .withBankFee(ZERO_BANK_FEE)
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
