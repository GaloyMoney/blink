import { MainBook, Transaction } from "./books"

import { getBankOwnerWalletId } from "./caching"

import { coldStorageAccountId, lndLedgerAccountId } from "./domain/accounts"

import { translateToLedgerJournal } from "./helpers"

import {
  LedgerTransactionType,
  toLiabilitiesWalletId,
  UnknownLedgerError,
} from "@/domain/ledger"
import { WalletCurrency } from "@/domain/shared"

export const admin = {
  isToHotWalletTxRecorded: async (
    txHash: OnChainTxHash,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = await Transaction.countDocuments({
        type: LedgerTransactionType.ToHotWallet,
        hash: txHash,
      })
      return result > 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addColdStorageTxReceive: async <T extends DisplayCurrency>({
    txHash,
    payeeAddress,
    description,
    sats,
    fee,
    feeDisplayCurrency,
    amountDisplayCurrency,
  }: AddColdStorageTxReceiveArgs<T>): Promise<LedgerJournal | LedgerServiceError> => {
    const metadata: AddColdStorageReceiveLedgerMetadata = {
      type: LedgerTransactionType.ToColdStorage,
      pending: false,
      hash: txHash,
      payee_addresses: [payeeAddress],
      fee,
      feeUsd: Number(feeDisplayCurrency.displayInMajor),
      usd: Number(amountDisplayCurrency.displayInMajor),
      currency: WalletCurrency.Btc,
    }

    try {
      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
        .credit(lndLedgerAccountId, sats + fee, metadata)
        .debit(bankOwnerPath, fee, metadata)
        .debit(coldStorageAccountId, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addColdStorageTxSend: async <T extends DisplayCurrency>({
    txHash,
    payeeAddress,
    description,
    sats,
    fee,
    amountDisplayCurrency,
    feeDisplayCurrency,
  }: AddColdStorageTxSendArgs<T>): Promise<LedgerJournal | LedgerServiceError> => {
    const metadata: AddColdStorageSendLedgerMetadata = {
      type: LedgerTransactionType.ToHotWallet,
      pending: false,
      hash: txHash,
      payee_addresses: [payeeAddress],
      fee,
      feeUsd: Number(feeDisplayCurrency.displayInMajor),
      usd: Number(amountDisplayCurrency.displayInMajor),
      currency: WalletCurrency.Btc,
    }

    try {
      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
        .credit(coldStorageAccountId, sats + fee, metadata)
        .debit(bankOwnerPath, fee, metadata)
        .debit(lndLedgerAccountId, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}
