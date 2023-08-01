import { toSats } from "@domain/bitcoin"
import { LedgerService } from "@services/ledger"
import { getCurrentPriceAsDisplayPriceRatio } from "@app/prices"
import { DisplayCurrency } from "@domain/fiat"

export const recordIncome = async ({
  satoshis,
  txId,
  proportionalFee,
  address,
}: {
  satoshis: BtcPaymentAmount
  txId: OnChainTxHash
  proportionalFee: BtcPaymentAmount
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  const description = `deposit of ${satoshis.amount} sats to the cold storage wallet`

  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: DisplayCurrency.Usd,
  })
  if (displayPriceRatio instanceof Error) return displayPriceRatio
  const amountDisplayCurrency = displayPriceRatio.convertFromWallet(satoshis)
  const feeDisplayCurrency = displayPriceRatio.convertFromWallet(proportionalFee)

  const ledgerService = LedgerService()
  const journal = await ledgerService.addColdStorageTxReceive({
    txHash: txId,
    description,
    sats: toSats(satoshis.amount),
    fee: toSats(proportionalFee.amount),
    amountDisplayCurrency,
    feeDisplayCurrency,
    payeeAddress: address,
  })
  if (journal instanceof Error) return journal

  return true
}
