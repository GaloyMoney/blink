import { LedgerTransactionType } from "@domain/ledger"

import { WalletCurrency } from "@domain/shared"

import { MainBook } from "./books"
import { EntryBuilder, toLedgerAccountId } from "./domain"
import { persistAndReturnEntry } from "./helpers"
import * as caching from "./caching"

const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
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
  senderWalletId: WalletId
  senderWalletCurrency: T
  amount: T extends "BTC"
    ? BtcPaymentAmount
    : {
        usd: UsdPaymentAmount
        btc: BtcPaymentAmount
      }
  metadata: AddLnSendLedgerMetadata
  fee?: BtcPaymentAmount
}

export const LedgerFacade = () => {
  const addLnTxSendMetadata = ({
    paymentHash,
    fee,
    feeDisplayCurrency,
    amountDisplayCurrency,
    pubkey,
    feeKnownInAdvance,
  }: {
    paymentHash: PaymentHash
    fee: BtcPaymentAmount
    feeDisplayCurrency: DisplayCurrencyBaseAmount
    amountDisplayCurrency: DisplayCurrencyBaseAmount
    pubkey: Pubkey
    feeKnownInAdvance: boolean
  }) => {
    const metadata: AddLnSendLedgerMetadata = {
      type: LedgerTransactionType.Payment,
      pending: true,
      hash: paymentHash,
      fee: Number(fee.amount) as Satoshis,
      feeUsd: feeDisplayCurrency,
      usd: amountDisplayCurrency,
      pubkey,
      feeKnownInAdvance,
    }
    return metadata
  }

  const recordSend = async <T extends WalletCurrency>({
    description,
    senderWalletId,
    senderWalletCurrency,
    amount,
    fee,
    metadata,
  }: RecordSendArgs<T>) => {
    const actualFee = fee || ZERO_SATS

    let entry = MainBook.entry(description)
    const builder = EntryBuilder({
      staticAccountIds: await staticAccountIds(),
      entry,
      metadata,
    }).withFee(actualFee)

    if (senderWalletCurrency === WalletCurrency.Usd) {
      const { usd, btc } = amount as { usd: UsdPaymentAmount; btc: BtcPaymentAmount }
      entry = builder
        .debitAccount({
          accountId: toLedgerAccountId(senderWalletId),
          amount: usd,
        })
        .creditLnd(btc)
    } else {
      entry = builder
        .debitAccount({
          accountId: toLedgerAccountId(senderWalletId),
          amount: amount as BtcPaymentAmount,
        })
        .creditLnd()
    }

    return persistAndReturnEntry({ entry, hash: metadata.hash })
  }

  return {
    recordSend,
    addLnTxSendMetadata,
  }
}
