import {
  CouldNotFindTransactionMetadataError,
  LedgerTransactionType,
  toLiabilitiesWalletId,
  UnknownLedgerError,
} from "@domain/ledger"
import { WalletCurrency } from "@domain/shared"
import { DuplicateError } from "@domain/errors"
import { SwapProvider } from "@domain/swap"
import { sha256 } from "@domain/bitcoin/lightning"

import { bitcoindAccountingPath, lndAccountingPath } from "./accounts"
import { MainBook, Transaction } from "./books"
import { getBankOwnerWalletId } from "./caching"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "."

const txMetadataRepo = TransactionsMetadataRepository()

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
    const metadata: AddColdStorageReceiveLedgerMetadata = {
      type: LedgerTransactionType.ToColdStorage,
      pending: false,
      hash: txHash,
      payee_addresses: [payeeAddress],
      fee,
      feeUsd: feeDisplayCurrency,
      usd: amountDisplayCurrency,
      currency: WalletCurrency.Btc,
    }

    try {
      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
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
    const metadata: AddColdStorageSendLedgerMetadata = {
      type: LedgerTransactionType.ToHotWallet,
      pending: false,
      hash: txHash,
      payee_addresses: [payeeAddress],
      fee,
      feeUsd: feeDisplayCurrency,
      usd: amountDisplayCurrency,
      currency: WalletCurrency.Btc,
    }

    try {
      const bankOwnerWalletId = await getBankOwnerWalletId()
      const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

      const entry = MainBook.entry(description)
        .credit(bitcoindAccountingPath, sats + fee, metadata)
        .debit(bankOwnerPath, fee, metadata)
        .debit(lndAccountingPath, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addSwapFeeTxSend: async (
    swapResult: SwapStatusResult,
  ): Promise<LedgerJournal | LedgerServiceError | DuplicateError> => {
    const swapFeeMetadata: SwapTransactionMetadataUpdate = {
      hash: sha256(Buffer.from(swapResult.id)) as SwapHash,
      swapId: swapResult.id as SwapId,
      swapAmount: Number(swapResult.amt),
      htlcAddress: swapResult.htlcAddress as OnChainAddress,
      onchainMinerFee: Number(swapResult.onchainMinerFee),
      offchainRoutingFee: Number(swapResult.offchainRoutingFee),
      serviceProviderFee: Number(swapResult.serviceProviderFee),
      serviceProvider: SwapProvider.Loop,
      currency: WalletCurrency.Btc,
      type: LedgerTransactionType.Fee,
    }
    const description = `Swap out fee for swapId ${swapFeeMetadata.swapId}`
    const totalSwapFee =
      swapFeeMetadata.offchainRoutingFee +
      swapFeeMetadata.onchainMinerFee +
      swapFeeMetadata.serviceProviderFee
    try {
      // check for duplicates
      const result = await txMetadataRepo.findByHash(swapFeeMetadata.hash)
      if (result instanceof CouldNotFindTransactionMetadataError) {
        const bankOwnerWalletId = await getBankOwnerWalletId()
        const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)
        const entry = MainBook.entry(description)
          .credit(lndAccountingPath, Number(totalSwapFee), {
            currency: WalletCurrency.Btc,
            pending: false,
            type: LedgerTransactionType.Fee,
          })
          .debit(bankOwnerPath, Number(totalSwapFee), {
            currency: WalletCurrency.Btc,
            pending: false,
            type: LedgerTransactionType.Fee,
          })
        const saved = await entry.commit()
        const journalEntry = translateToLedgerJournal(saved)
        const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
          id,
          hash: swapFeeMetadata.hash,
          swap: swapFeeMetadata,
        }))
        const metadataResults = await txMetadataRepo.persistAll(txsMetadataToPersist)
        if (metadataResults instanceof Error) return metadataResults
        return journalEntry
      } else {
        return new DuplicateError()
      }
    } catch (error) {
      return new UnknownLedgerError(error)
    }
  },
}
