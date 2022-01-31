import {
  LedgerTransactionType,
  toLiabilitiesWalletId,
  UnknownLedgerError,
} from "@domain/ledger"
import { WalletCurrency } from "@domain/wallets"

import { bitcoindAccountingPath, lndAccountingPath } from "./accounts"
import { MainBook, Transaction } from "./books"
import { getBankOwnerWalletId } from "./caching"

import { translateToLedgerJournal } from "."

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

  addColdStorageTxReceive: async ({
    txHash,
    payeeAddress,
    description,
    sats,
    fee,
    feeDisplayCurrency,
    amountDisplayCurrency,
  }: AddColdStorageTxReceiveArgs): Promise<LedgerJournal | LedgerServiceError> => {
    let metadata: AddColdStorageTxReceiveMetadata
    try {
      metadata = {
        type: LedgerTransactionType.ToColdStorage,
        pending: false,
        hash: txHash,
        payee_addresses: [payeeAddress],
        fee,
        feeUsd: feeDisplayCurrency,
        usd: amountDisplayCurrency,
        currency: WalletCurrency.Btc,
      }

      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
      entry
        .credit(lndAccountingPath, sats + fee, metadata)
        .debit(bankOwnerPath, fee, metadata)
        .debit(bitcoindAccountingPath, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addColdStorageTxSend: async ({
    txHash,
    payeeAddress,
    description,
    sats,
    fee,
    amountDisplayCurrency,
    feeDisplayCurrency,
  }: AddColdStorageTxSendArgs): Promise<LedgerJournal | LedgerServiceError> => {
    let metadata: AddColdStorageTxSendMetadata
    try {
      metadata = {
        type: LedgerTransactionType.ToHotWallet,
        pending: false,
        hash: txHash,
        payee_addresses: [payeeAddress],
        fee,
        feeUsd: feeDisplayCurrency,
        usd: amountDisplayCurrency,
        currency: WalletCurrency.Btc,
      }

      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
      entry
        .credit(bitcoindAccountingPath, sats + fee, metadata)
        .debit(bankOwnerPath, fee, metadata)
        .debit(lndAccountingPath, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}
