import { LnPaymentStateDeterminator } from "@/domain/ledger/ln-payment-state"
import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"

export const updateLnPaymentState = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<true | ApplicationError> => {
  const txns = await LedgerService().getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash,
  })
  if (txns instanceof Error) return txns
  const lnPaymentState = LnPaymentStateDeterminator(txns).determine()
  if (lnPaymentState instanceof Error) {
    return lnPaymentState
  }
  const markedState = await LedgerFacade.updateStateByHash({
    paymentHash,
    state: lnPaymentState,
  })
  if (markedState instanceof Error) return markedState

  return true
}
