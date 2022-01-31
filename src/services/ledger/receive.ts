import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"
import { WalletCurrency } from "@domain/wallets"

import { lndAccountingPath } from "./accounts"
import { MainBook } from "./books"
import * as caching from "./caching"

import { translateToLedgerJournal } from "."

export const receive = {
  addOnChainTxReceive: async ({
    walletId,
    txHash,
    sats,
    fee,
    usd,
    usdFee,
    receivingAddress,
  }: ReceiveOnChainTxArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    try {
      const metadata = {
        currency: "BTC",
        type: LedgerTransactionType.OnchainReceipt,
        pending: false,
        hash: txHash,
        fee,
        usdFee,
        sats,
        usd,
        payee_addresses: [receivingAddress],
      }

      const entry = MainBook.entry("")
        .credit(liabilitiesWalletId, sats - fee, metadata)
        .debit(lndAccountingPath, sats, metadata)

      if (fee > 0) {
        const bankOwnerPath = toLiabilitiesWalletId(await caching.getBankOwnerWalletId())
        entry.credit(bankOwnerPath, fee, metadata)
      }

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addLnTxReceive: async ({
    walletId,
    paymentHash,
    description,
    sats,
    feeInboundLiquidityDisplayCurrency,
    amountDisplayCurrency,
    feeInboundLiquidity,
  }: AddLnTxReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    let metadata: AddLnTxReceiveMetadata
    try {
      metadata = {
        type: LedgerTransactionType.Invoice,
        pending: false,
        hash: paymentHash,
        fee: feeInboundLiquidity,
        feeUsd: feeInboundLiquidityDisplayCurrency,
        usd: amountDisplayCurrency,
        currency: WalletCurrency.Btc,
      }

      const entry = MainBook.entry(description)
      entry
        .credit(liabilitiesWalletId, sats - feeInboundLiquidity, metadata)
        .debit(lndAccountingPath, sats, metadata)

      if (feeInboundLiquidity > 0) {
        const bankOwnerPath = toLiabilitiesWalletId(await caching.getBankOwnerWalletId())
        entry.credit(bankOwnerPath, feeInboundLiquidity, metadata)
      }

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addLnFeeReimbursementReceive: async ({
    walletId,
    paymentHash,
    sats,
    usd,
    journalId,
  }: AddLnFeeReeimbursementReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    try {
      const metadata = {
        type: LedgerTransactionType.LnFeeReimbursement,
        currency: "BTC",
        hash: paymentHash,
        related_journal: journalId,
        pending: false,
        usd,
      }

      const description = "fee reimbursement"
      const entry = MainBook.entry(description)
      entry
        .credit(liabilitiesWalletId, sats, metadata)
        .debit(lndAccountingPath, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}
